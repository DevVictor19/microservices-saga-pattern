# Microservices Saga Pattern

Implementação prática do padrão **Saga** para gerenciamento de transações distribuídas em microsserviços, com duas abordagens: **Coreografada** e **Orquestrada**.

## Cenário de Negócio

Um fluxo de pagamento de pedido que envolve 4 microsserviços:

| Serviço              | Responsabilidade                                      |
| -------------------- | ----------------------------------------------------- |
| **orders-service**   | Gerenciamento de pedidos e controle de status         |
| **stock-service**    | Reserva de estoque, entregas e controle de inventário |
| **payments-service** | Processamento de pagamentos                           |
| **loyalty-service**  | Programa de pontos de fidelidade                      |

O fluxo completo é: **criar pedido → reservar estoque → processar pagamento → registrar entrega + calcular pontos de fidelidade**, com compensações automáticas em caso de falha.

---

## Projetos

### 1. Saga Coreografada (`choreographed-saga/`)

Cada serviço publica e reage a **eventos de domínio** de forma independente, sem um coordenador central. A coordenação emerge da coreografia entre os serviços.

- **Comunicação:** Redis Pub/Sub (canais: `order-events`, `stock-events`, `payment-events`)
- **Padrão:** Publish/Subscribe — serviços publicam eventos e múltiplos consumidores reagem
- **Compensação:** Serviços reagem independentemente a eventos de falha (ex: stock-service escuta `PAYMENT_FAILED` e desfaz a reserva)
- **Documentação completa:** [`choreographed-saga/@docs/choreographed-saga-flow.md`](choreographed-saga/@docs/choreographed-saga-flow.md)

```
Cliente → Orders (START_ORDER_PAYMENT)
           → Stock (RESERVATION_SUCCEED / RESERVATION_FAILED)
              → Payments (PAYMENT_SUCCEED / PAYMENT_FAILED)
                 → Orders (atualiza status)
                 → Stock (entrega ou desfaz reserva)
                 → Loyalty (calcula pontos)
```

### 2. Saga Orquestrada (`orchestrated-saga/`)

O **orders-service** atua como orquestrador central, controlando todo o fluxo de forma imperativa através de filas de comando e resultado.

- **Comunicação:** BullMQ (filas Redis com workers)
- **Padrão:** Command/Reply — orquestrador envia comandos e recebe resultados
- **Compensação:** Orquestrador envia comando explícito de undo (ex: publica na fila `order-items-undo-reservation-queue`)
- **Documentação completa:** [`orchestrated-saga/@docs/orchestrated-saga-flow.md`](orchestrated-saga/@docs/orchestrated-saga-flow.md)

```
Cliente → Orders (orquestrador)
           → [fila] Stock: reservar itens → [fila resultado] Orders
           → [fila] Payments: processar pagamento → [fila resultado] Orders
           → [fila] Stock: enviar para entrega
           → [fila] Loyalty: calcular pontos
```

---

## Comparação entre as Abordagens

| Aspecto                   | Coreografada                        | Orquestrada                         |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| **Controle de fluxo**     | Distribuído entre todos os serviços | Centralizado no orders-service      |
| **Message broker**        | Redis Pub/Sub (canais)              | BullMQ (filas Redis)                |
| **Comunicação**           | Publish/Subscribe (eventos)         | Command/Reply (request-response)    |
| **Compensação**           | Serviços reagem a eventos de falha  | Orquestrador envia comando de undo  |
| **Acoplamento**           | Serviços conhecem eventos de outros | Workers não conhecem uns aos outros |
| **Visibilidade do fluxo** | Distribuída entre consumidores      | Centralizada em um só lugar         |
| **Ponto único de falha**  | Não há                              | Orquestrador pode ser gargalo       |
| **Complexidade**          | Fluxo difícil de rastrear           | Fluxo fácil de entender             |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)

---

## Como Rodar

### Saga Coreografada

```bash
cd choreographed-saga
docker compose up --build
```

### Saga Orquestrada

```bash
cd orchestrated-saga
docker compose up --build
```

> **Nota:** Os dois projetos usam as mesmas portas, então execute apenas um de cada vez, ou pare o primeiro antes de iniciar o segundo.

### Parar os serviços

```bash
docker compose down
```

Para remover também os volumes (dados do banco):

```bash
docker compose down -v
```

---

## Portas dos Serviços

| Serviço          | Porta Host |
| ---------------- | ---------- |
| stock-service    | `3000`     |
| orders-service   | `3001`     |
| payments-service | `3002`     |
| loyalty-service  | `3003`     |
| PostgreSQL       | `5432`     |
| Redis            | `6379`     |

---

## Testando o Fluxo

Após subir os containers, inicie o fluxo de pagamento:

```bash
curl -X POST http://localhost:3001/v1/orders/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderUuid": "e2887507-664e-4469-abfc-e17943d13a5b",
    "paymentMethodUuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  }'
```

Para simular uma **falha no pagamento** (compensação), use o UUID de método de pagamento de teste:

```bash
curl -X POST http://localhost:3001/v1/orders/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderUuid": "e2887507-664e-4469-abfc-e17943d13a5b",
    "paymentMethodUuid": "ff1a8411-b443-408f-8012-fa62eb9067bd"
  }'
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS
- **ORM:** TypeORM
- **Banco de Dados:** PostgreSQL 18
- **Message Broker:** Redis 8
- **Gerenciador de Pacotes:** pnpm
- **Containerização:** Docker Compose
