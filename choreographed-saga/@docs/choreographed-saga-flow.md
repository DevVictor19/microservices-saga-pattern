# Choreographed Saga — Fluxo de Eventos

## Visão Geral

Este projeto implementa o padrão **Saga Coreografada** para processar pagamentos de pedidos em uma arquitetura de microsserviços. Cada serviço reage a eventos publicados por outros serviços via **Redis Pub/Sub**, sem a presença de um orquestrador central.

### Serviços

| Serviço              | Porta | Responsabilidade                   |
| -------------------- | ----- | ---------------------------------- |
| **orders-service**   | 3000  | Gerencia pedidos e coordena status |
| **stock-service**    | 3001  | Reserva e controle de estoque      |
| **payments-service** | 3002  | Processamento de pagamentos        |
| **loyalty-service**  | 3003  | Programa de pontos de fidelidade   |

### Canais Redis Pub/Sub

| Canal            | Produtor         | Consumidores                                   |
| ---------------- | ---------------- | ---------------------------------------------- |
| `order-events`   | orders-service   | stock-service                                  |
| `stock-events`   | stock-service    | orders-service, payments-service               |
| `payment-events` | payments-service | orders-service, stock-service, loyalty-service |

### Tipos de Eventos

| Evento                | Canal          | Descrição                    |
| --------------------- | -------------- | ---------------------------- |
| `START_ORDER_PAYMENT` | order-events   | Início do fluxo de pagamento |
| `RESERVATION_SUCCEED` | stock-events   | Itens reservados com sucesso |
| `RESERVATION_FAILED`  | stock-events   | Falha na reserva de itens    |
| `PAYMENT_SUCCEED`     | payment-events | Pagamento aprovado           |
| `PAYMENT_FAILED`      | payment-events | Pagamento recusado           |

---

## Diagrama — Fluxo Completo (Happy Path + Compensações)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Orders as Orders Service
    participant Redis as Redis Pub/Sub
    participant Stock as Stock Service
    participant Payments as Payments Service
    participant Loyalty as Loyalty Service

    Note over Client,Loyalty: ═══ HAPPY PATH — Pagamento com Sucesso ═══

    Client->>Orders: POST /api/v1/orders/payments<br/>{orderUuid, paymentMethodUuid}
    activate Orders
    Orders->>Orders: Valida pedido (status = waiting_payment)
    Orders->>Redis: Publica START_ORDER_PAYMENT<br/>no canal "order-events"
    Orders->>Orders: Atualiza status → reserving_items
    Orders-->>Client: 200 OK
    deactivate Orders

    Redis->>Stock: Consome START_ORDER_PAYMENT
    activate Stock
    Note over Stock: Aguarda 10s (simulação)
    Stock->>Stock: Para cada item do pedido:<br/>- Lock pessimista no item<br/>- Decrementa quantityInStock<br/>- Cria registro item_reservation
    Stock->>Redis: Publica RESERVATION_SUCCEED<br/>no canal "stock-events"
    deactivate Stock

    par Consumidores de stock-events
        Redis->>Orders: Consome RESERVATION_SUCCEED
        activate Orders
        Orders->>Orders: Atualiza status → payment_processing
        deactivate Orders
    and
        Redis->>Payments: Consome RESERVATION_SUCCEED
        activate Payments
        Note over Payments: Aguarda 10s (simulação)
        Payments->>Payments: Cria payment (status = pending)
        Payments->>Payments: Processa pagamento → completed
        Payments->>Redis: Publica PAYMENT_SUCCEED<br/>no canal "payment-events"
        deactivate Payments
    end

    par Consumidores de payment-events
        Redis->>Orders: Consome PAYMENT_SUCCEED
        activate Orders
        Orders->>Orders: Atualiza status → payment_succeeded ✅
        deactivate Orders
    and
        Redis->>Stock: Consome PAYMENT_SUCCEED
        activate Stock
        Stock->>Stock: Cria registros item_delivery<br/>(com delivery_forecast)
        Stock->>Stock: Remove registros item_reservation
        deactivate Stock
    and
        Redis->>Loyalty: Consome PAYMENT_SUCCEED
        activate Loyalty
        Loyalty->>Loyalty: Calcula pontos = floor(totalPrice × 0.25)
        Loyalty->>Loyalty: Cria registro loyalty_point
        deactivate Loyalty
    end

    Note over Client,Loyalty: ═══ COMPENSAÇÃO 1 — Falha na Reserva de Itens ═══

    Client->>Orders: POST /api/v1/orders/payments
    activate Orders
    Orders->>Redis: Publica START_ORDER_PAYMENT
    Orders->>Orders: Status → reserving_items
    deactivate Orders

    Redis->>Stock: Consome START_ORDER_PAYMENT
    activate Stock
    Stock->>Stock: Item sem estoque suficiente
    Stock->>Stock: Rollback da transação (DB)
    Stock->>Redis: Publica RESERVATION_FAILED<br/>no canal "stock-events"<br/>{failedItems}
    deactivate Stock

    Redis->>Orders: Consome RESERVATION_FAILED
    activate Orders
    Orders->>Orders: Atualiza status → unavailable_items ❌
    deactivate Orders
    Note over Payments: Não reage a RESERVATION_FAILED

    Note over Client,Loyalty: ═══ COMPENSAÇÃO 2 — Falha no Pagamento ═══

    Note over Stock: (Após RESERVATION_SUCCEED bem-sucedido)

    Redis->>Payments: Consome RESERVATION_SUCCEED
    activate Payments
    Payments->>Payments: Cria payment (status = pending)
    Payments->>Payments: Pagamento recusado → failed
    Payments->>Redis: Publica PAYMENT_FAILED<br/>no canal "payment-events"<br/>{reason}
    deactivate Payments

    par Consumidores de payment-events (compensação)
        Redis->>Orders: Consome PAYMENT_FAILED
        activate Orders
        Orders->>Orders: Atualiza status → payment_failed ❌
        deactivate Orders
    and
        Redis->>Stock: Consome PAYMENT_FAILED
        activate Stock
        Stock->>Stock: Restaura quantityInStock<br/>(incrementa de volta)
        Stock->>Stock: Remove registros item_reservation
        deactivate Stock
    end
    Note over Loyalty: Não reage a PAYMENT_FAILED
```

---

## Diagrama — Matriz de Publicação e Assinatura

```mermaid
flowchart LR
    subgraph Producers["Produtores"]
        O[Orders Service]
        S[Stock Service]
        P[Payments Service]
    end

    subgraph Channels["Canais Redis"]
        OE[order-events]
        SE[stock-events]
        PE[payment-events]
    end

    subgraph Consumers["Consumidores"]
        O2[Orders Service]
        S2[Stock Service]
        P2[Payments Service]
        L[Loyalty Service]
    end

    O -->|START_ORDER_PAYMENT| OE
    S -->|RESERVATION_SUCCEED<br/>RESERVATION_FAILED| SE
    P -->|PAYMENT_SUCCEED<br/>PAYMENT_FAILED| PE

    OE -->|START_ORDER_PAYMENT| S2
    SE -->|RESERVATION_SUCCEED<br/>RESERVATION_FAILED| O2
    SE -->|RESERVATION_SUCCEED| P2
    PE -->|PAYMENT_SUCCEED<br/>PAYMENT_FAILED| O2
    PE -->|PAYMENT_SUCCEED<br/>PAYMENT_FAILED| S2
    PE -->|PAYMENT_SUCCEED| L
```

---

## Diagrama — Ciclo de Vida do Status do Pedido

```mermaid
stateDiagram-v2
    [*] --> waiting_payment: Pedido criado

    waiting_payment --> reserving_items: START_ORDER_PAYMENT publicado

    reserving_items --> unavailable_items: RESERVATION_FAILED recebido
    reserving_items --> payment_processing: RESERVATION_SUCCEED recebido

    payment_processing --> payment_failed: PAYMENT_FAILED recebido
    payment_processing --> payment_succeeded: PAYMENT_SUCCEED recebido

    unavailable_items --> [*]
    payment_failed --> [*]
    payment_succeeded --> [*]
```

---

## Fluxo Detalhado Passo a Passo

### 1. Início — Cliente Solicita Pagamento

O cliente faz uma requisição `POST /api/v1/orders/payments` com `orderUuid` e `paymentMethodUuid`. O **orders-service** valida que o pedido existe e tem status `waiting_payment`, publica o evento `START_ORDER_PAYMENT` no canal `order-events` e atualiza o status do pedido para `reserving_items`.

### 2. Reserva de Itens

O **stock-service** consome o evento `START_ORDER_PAYMENT`. Para cada item do pedido, dentro de uma transação com lock pessimista:

- Verifica se há estoque suficiente (`quantityInStock >= quantidade solicitada`)
- Decrementa `quantityInStock`
- Cria um registro `item_reservation`

**Sucesso:** Publica `RESERVATION_SUCCEED` no canal `stock-events`.  
**Falha:** Faz rollback de toda a transação e publica `RESERVATION_FAILED` com a lista de itens indisponíveis.

### 3. Processamento do Pagamento

O **payments-service** consome `RESERVATION_SUCCEED` do canal `stock-events`. Cria um registro de pagamento com status `pending` e processa o pagamento:

- Verifica duplicidade (mesmo `userUuid` + `orderUuid` + `paymentMethodUuid`)
- Se o `paymentMethodUuid` é o UUID de teste de falha (`ff1a8411-b443-408f-8012-fa62eb9067bd`), marca como `failed`
- Caso contrário, marca como `completed`

**Sucesso:** Publica `PAYMENT_SUCCEED` no canal `payment-events`.  
**Falha:** Publica `PAYMENT_FAILED` com o motivo.

### 4. Finalização — Reações ao Resultado do Pagamento

#### Pagamento com Sucesso (`PAYMENT_SUCCEED`)

| Serviço             | Ação                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **orders-service**  | Atualiza status do pedido → `payment_succeeded`                                           |
| **stock-service**   | Cria registros `item_delivery` com previsão de entrega e remove os `item_reservation`     |
| **loyalty-service** | Calcula pontos de fidelidade (`floor(totalPrice × 0.25)`) e cria registro `loyalty_point` |

#### Pagamento com Falha (`PAYMENT_FAILED`)

| Serviço             | Ação (Compensação)                                        |
| ------------------- | --------------------------------------------------------- |
| **orders-service**  | Atualiza status do pedido → `payment_failed`              |
| **stock-service**   | Restaura `quantityInStock` e remove os `item_reservation` |
| **loyalty-service** | Nenhuma ação                                              |

---

## Infraestrutura

- **Message Broker:** Redis 7 (Pub/Sub via `ioredis`)
- **Banco de Dados:** PostgreSQL 17 (um banco por serviço)
- **Framework:** NestJS com TypeORM
- **Containerização:** Docker Compose
