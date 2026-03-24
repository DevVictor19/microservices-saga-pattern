# Orchestrated Saga — Fluxo de Eventos

## Visão Geral

Este projeto implementa o padrão **Saga Orquestrada** para processar pagamentos de pedidos em uma arquitetura de microsserviços. O **orders-service** atua como orquestrador central, controlando todo o fluxo de forma imperativa através de filas de comando e resultado via **BullMQ** (Redis).

### Serviços

| Serviço              | Porta | Papel                                                      |
| -------------------- | ----- | ---------------------------------------------------------- |
| **orders-service**   | 3000  | Orquestrador — gerencia pedidos e controla o fluxo da saga |
| **stock-service**    | 3001  | Worker — reserva de estoque e entregas                     |
| **payments-service** | 3002  | Worker — processamento de pagamentos                       |
| **loyalty-service**  | 3003  | Worker — programa de pontos de fidelidade                  |

### Filas BullMQ

| Fila                                   | Job Name                             | Produtor         | Consumidor       |
| -------------------------------------- | ------------------------------------ | ---------------- | ---------------- |
| `order-items-reservation-queue`        | `order-items-reservation-job`        | orders-service   | stock-service    |
| `order-items-reservation-result-queue` | `order-items-reservation-result-job` | stock-service    | orders-service   |
| `order-payment-queue`                  | `order-payment-job`                  | orders-service   | payments-service |
| `order-payment-result-queue`           | `payment-result-job`                 | payments-service | orders-service   |
| `order-items-undo-reservation-queue`   | `undo-reservation-job`               | orders-service   | stock-service    |
| `order-send-to-deliver-queue`          | `send-to-deliver-job`                | orders-service   | stock-service    |
| `order-receive-loyalty-points-queue`   | `receive-loyalty-points-job`         | orders-service   | loyalty-service  |

### Padrão de Comunicação

Diferentemente da saga coreografada (Redis Pub/Sub), aqui cada interação segue o padrão **Command/Reply**:

- O orquestrador envia um **comando** para uma fila de destino
- O worker processa e envia o **resultado** de volta para uma fila de resposta
- O orquestrador decide o próximo passo com base no resultado

---

## Diagrama — Fluxo Completo (Happy Path + Compensações)

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant OC as Orders Service<br/>(Controller)
    participant OS as Orders Service<br/>(Orchestrator)
    participant Q1 as 📨 order-items-<br/>reservation-queue
    participant SS as Stock Service<br/>(Reservation)
    participant Q2 as 📨 order-items-reservation-<br/>result-queue
    participant Q3 as 📨 order-payment-queue
    participant PS as Payments Service
    participant Q4 as 📨 order-payment-<br/>result-queue
    participant Q5 as 📨 order-send-to-<br/>deliver-queue
    participant Q6 as 📨 order-receive-loyalty-<br/>points-queue
    participant SD as Stock Service<br/>(Delivery)
    participant LS as Loyalty Service
    participant Q7 as 📨 order-items-undo-<br/>reservation-queue

    Note over Client,LS: ✅ SUCCESS FLOW

    Client->>OC: POST /v1/orders/payments<br/>{orderUuid, paymentMethodUuid}
    OC->>OS: prepareOrderForPayment()
    OS->>OS: Validate order exists &<br/>status = WAITING_PAYMENT
    OS->>Q1: Publish reservation request<br/>{userUuid, orderUuid, items[]}
    OS->>OS: Update status → RESERVING_ITEMS
    OC-->>Client: 202 Accepted

    Q1->>SS: Consume: reserveItems()
    Note right of SS: ⏳ 10s delay (simulated)
    SS->>SS: Reserve items in DB<br/>(decrement stock)
    SS->>Q2: Publish result<br/>{success: true, reservationUuids[]}

    Q2->>OS: Consume: processReservationResult()
    OS->>Q3: Publish payment request<br/>{userUuid, orderUuid, totalPrice}
    OS->>OS: Update status → PAYMENT_PROCESSING

    Q3->>PS: Consume: processPayment()
    Note right of PS: ⏳ 10s delay (simulated)
    PS->>PS: Create Payment (PENDING)
    PS->>PS: Process payment → COMPLETED
    PS->>Q4: Publish result {success: true}

    Q4->>OS: Consume: processPaymentResult()
    OS->>OS: Update status → PAYMENT_SUCCEEDED

    par Send to Delivery
        OS->>Q5: Publish delivery request<br/>{userUuid, orderUuid}
        Q5->>SD: Consume: sendToDeliver()
        Note right of SD: ⏳ 10s delay
        SD->>SD: Create delivery record
    and Loyalty Points
        OS->>Q6: Publish loyalty request<br/>{userUuid, orderUuid, totalPrice}
        Q6->>LS: Consume: calcLoyaltyPoints()
        Note right of LS: ⏳ 10s delay
        LS->>LS: Calculate & save points<br/>(totalPrice × 0.25)
    end

    Note over Client,LS: ❌ FAILURE FLOW 1 — Items Unavailable

    Client->>OC: POST /v1/orders/payments
    OC->>OS: prepareOrderForPayment()
    OS->>Q1: Publish reservation request
    OS->>OS: Update status → RESERVING_ITEMS

    Q1->>SS: Consume: reserveItems()
    SS->>SS: Insufficient stock!
    SS->>Q2: Publish result<br/>{success: false, failedItems[]}

    Q2->>OS: Consume: processReservationResult()
    OS->>OS: Update status → UNAVAILABLE_ITEMS
    Note over OS: ⛔ Saga ends — no compensation needed

    Note over Client,LS: ❌ FAILURE FLOW 2 — Payment Failed (with Compensation)

    Client->>OC: POST /v1/orders/payments
    OC->>OS: prepareOrderForPayment()
    OS->>Q1: Publish reservation request
    OS->>OS: Update status → RESERVING_ITEMS

    Q1->>SS: Consume: reserveItems()
    SS->>SS: Reserve items ✅
    SS->>Q2: Publish result {success: true}

    Q2->>OS: Consume: processReservationResult()
    OS->>Q3: Publish payment request
    OS->>OS: Update status → PAYMENT_PROCESSING

    Q3->>PS: Consume: processPayment()
    PS->>PS: Create Payment (PENDING)
    PS->>PS: Payment declined! → FAILED
    PS->>Q4: Publish result<br/>{success: false, reason: "declined"}

    Q4->>OS: Consume: processPaymentResult()
    OS->>OS: Update status → PAYMENT_FAILED

    rect rgb(255, 230, 230)
        Note over OS,SS: 🔄 COMPENSATION: Undo Reservation
        OS->>Q7: Publish undo reservation<br/>{userUuid, orderUuid}
        Q7->>SS: Consume: undoReservation()
        Note right of SS: ⏳ 10s delay
        SS->>SS: Restore stock &<br/>delete reservations
    end
```

---

## Diagrama — Arquitetura de Filas (Command/Reply)

```mermaid
flowchart LR
    subgraph Orchestrator["Orquestrador (orders-service)"]
        O[Orders Service]
    end

    subgraph Commands["Filas de Comando"]
        Q1[order-items-reservation-queue]
        Q3[order-payment-queue]
        Q5[order-send-to-deliver-queue]
        Q6[order-receive-loyalty-points-queue]
        Q7[order-items-undo-reservation-queue]
    end

    subgraph Results["Filas de Resultado"]
        Q2[order-items-reservation-result-queue]
        Q4[order-payment-result-queue]
    end

    subgraph Workers["Workers"]
        S[Stock Service]
        P[Payments Service]
        L[Loyalty Service]
    end

    O -->|"Comando: reservar itens"| Q1
    O -->|"Comando: processar pagamento"| Q3
    O -->|"Comando: enviar para entrega"| Q5
    O -->|"Comando: calcular pontos"| Q6
    O -->|"Compensação: desfazer reserva"| Q7

    Q1 --> S
    Q3 --> P
    Q5 --> S
    Q6 --> L
    Q7 --> S

    S -->|"Resultado: reserva"| Q2
    P -->|"Resultado: pagamento"| Q4

    Q2 --> O
    Q4 --> O
```

---

## Diagrama — Ciclo de Vida do Status do Pedido

```mermaid
stateDiagram-v2
    [*] --> waiting_payment: Pedido criado

    waiting_payment --> reserving_items: Comando enviado para<br/>order-items-reservation-queue

    reserving_items --> unavailable_items: Resultado: success=false
    reserving_items --> payment_processing: Resultado: success=true<br/>→ Comando enviado para<br/>order-payment-queue

    payment_processing --> payment_failed: Resultado: success=false<br/>→ Compensação: undo reservation
    payment_processing --> payment_succeeded: Resultado: success=true<br/>→ Comandos: deliver + loyalty

    unavailable_items --> [*]
    payment_failed --> [*]
    payment_succeeded --> [*]
```

---

## Diagrama — Matriz Produtor/Consumidor por Serviço

```mermaid
flowchart TB
    subgraph orders-service["orders-service (Orquestrador)"]
        direction TB
        OP["Publica em:<br/>• order-items-reservation-queue<br/>• order-payment-queue<br/>• order-items-undo-reservation-queue<br/>• order-send-to-deliver-queue<br/>• order-receive-loyalty-points-queue"]
        OC["Consome de:<br/>• order-items-reservation-result-queue<br/>• order-payment-result-queue"]
    end

    subgraph stock-service["stock-service (Worker)"]
        direction TB
        SP["Publica em:<br/>• order-items-reservation-result-queue"]
        SC["Consome de:<br/>• order-items-reservation-queue<br/>• order-items-undo-reservation-queue<br/>• order-send-to-deliver-queue"]
    end

    subgraph payments-service["payments-service (Worker)"]
        direction TB
        PP["Publica em:<br/>• order-payment-result-queue"]
        PC["Consome de:<br/>• order-payment-queue"]
    end

    subgraph loyalty-service["loyalty-service (Worker)"]
        direction TB
        LC["Consome de:<br/>• order-receive-loyalty-points-queue"]
        LN["Publica em: nenhuma fila"]
    end
```

---

## Fluxo Detalhado Passo a Passo

### 1. Início — Cliente Solicita Pagamento

O cliente faz uma requisição `POST /v1/orders/payments` com `orderUuid` e `paymentMethodUuid`. O **orders-service** (orquestrador) valida que o pedido existe e tem status `waiting_payment`, envia um comando de reserva para a fila `order-items-reservation-queue` e atualiza o status do pedido para `reserving_items`.

### 2. Reserva de Itens (Stock Service)

O **stock-service** consome o job `order-items-reservation-job`. Para cada item do pedido, dentro de uma transação com lock pessimista:

- Verifica se há estoque suficiente (`quantityInStock >= quantidade solicitada`)
- Decrementa `quantityInStock`
- Cria um registro `item_reservation`

**Sucesso:** Publica `order-items-reservation-result-job` na fila de resultado com `success: true` e `reservationUuids[]`.
**Falha:** Faz rollback de toda a transação e publica resultado com `success: false` e `failedItems[]`.

### 3. Orquestrador Processa Resultado da Reserva

O **orders-service** consome o resultado da fila `order-items-reservation-result-queue`:

- **`success: true`** → Envia comando de pagamento para `order-payment-queue` com `totalPrice` e atualiza status para `payment_processing`
- **`success: false`** → Atualiza status para `unavailable_items` e a saga termina (sem necessidade de compensação)

### 4. Processamento do Pagamento (Payments Service)

O **payments-service** consome o job `order-payment-job`. Cria um registro de pagamento com status `pending` e processa:

- Verifica duplicidade (mesmo `userUuid` + `orderUuid` + `paymentMethodUuid`)
- Se o `paymentMethodUuid` é o UUID de teste de falha (`ff1a8411-b443-408f-8012-fa62eb9067bd`), marca como `failed`
- Caso contrário, marca como `completed`

**Sucesso:** Publica `payment-result-job` na fila de resultado com `success: true`.
**Falha:** Publica resultado com `success: false` e `reason`.

### 5. Orquestrador Processa Resultado do Pagamento

O **orders-service** consome o resultado da fila `order-payment-result-queue`:

#### Pagamento com Sucesso (`success: true`)

O orquestrador atualiza status para `payment_succeeded` e dispara dois comandos em paralelo:

| Fila                                 | Serviço Destino | Ação                                                                               |
| ------------------------------------ | --------------- | ---------------------------------------------------------------------------------- |
| `order-send-to-deliver-queue`        | stock-service   | Cria registros `item_delivery` com previsão de entrega e remove `item_reservation` |
| `order-receive-loyalty-points-queue` | loyalty-service | Calcula pontos `floor(totalPrice × 0.25)` e cria registro `loyalty_point`          |

#### Pagamento com Falha (`success: false`)

O orquestrador atualiza status para `payment_failed` e dispara a **compensação**:

| Fila                                 | Serviço Destino | Ação (Compensação)                                     |
| ------------------------------------ | --------------- | ------------------------------------------------------ |
| `order-items-undo-reservation-queue` | stock-service   | Restaura `quantityInStock` e remove `item_reservation` |

---

## Comparação: Saga Orquestrada vs Saga Coreografada

| Aspecto                   | Orquestrada (este projeto)                    | Coreografada                                            |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| **Controle de fluxo**     | Centralizado no orders-service                | Distribuído entre todos os serviços                     |
| **Message broker**        | BullMQ (filas Redis)                          | Redis Pub/Sub (canais)                                  |
| **Padrão de comunicação** | Command/Reply (request-response)              | Publish/Subscribe (eventos)                             |
| **Compensação**           | Orquestrador envia comando explícito de undo  | Serviços reagem independentemente a eventos de falha    |
| **Acoplamento**           | Workers não conhecem uns aos outros           | Serviços precisam conhecer os eventos de outros         |
| **Visibilidade do fluxo** | Fluxo completo em um só lugar (order.service) | Fluxo distribuído entre os consumidores de cada serviço |
| **Escalabilidade**        | Orquestrador pode ser gargalo                 | Sem ponto central de controle                           |

---

## Infraestrutura

- **Message Broker:** Redis 8 (BullMQ — filas com workers)
- **Banco de Dados:** PostgreSQL 17 (um banco por serviço)
- **Framework:** NestJS com TypeORM + `@nestjs/bullmq`
- **Containerização:** Docker Compose
