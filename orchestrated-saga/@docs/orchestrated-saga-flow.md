# Orchestrated Saga — Event Flow

## Overview

This project implements the **Orchestrated Saga** pattern for processing order payments in a microservices architecture. The **orders-service** acts as a central orchestrator, controlling the entire flow imperatively through command and result queues via **BullMQ** (Redis).

### Services

| Service              | Port | Role                                                         |
| -------------------- | ---- | ------------------------------------------------------------ |
| **orders-service**   | 3000 | Orchestrator — manages orders and controls the saga flow     |
| **stock-service**    | 3001 | Worker — stock reservation and deliveries                    |
| **payments-service** | 3002 | Worker — payment processing                                  |
| **loyalty-service**  | 3003 | Worker — loyalty points program                              |

### BullMQ Queues

| Queue                                  | Job Name                             | Producer         | Consumer         |
| -------------------------------------- | ------------------------------------ | ---------------- | ---------------- |
| `order-items-reservation-queue`        | `order-items-reservation-job`        | orders-service   | stock-service    |
| `order-items-reservation-result-queue` | `order-items-reservation-result-job` | stock-service    | orders-service   |
| `order-payment-queue`                  | `order-payment-job`                  | orders-service   | payments-service |
| `order-payment-result-queue`           | `payment-result-job`                 | payments-service | orders-service   |
| `order-items-undo-reservation-queue`   | `undo-reservation-job`               | orders-service   | stock-service    |
| `order-send-to-deliver-queue`          | `send-to-deliver-job`                | orders-service   | stock-service    |
| `order-receive-loyalty-points-queue`   | `receive-loyalty-points-job`         | orders-service   | loyalty-service  |

### Communication Pattern

Unlike the choreographed saga (Redis Pub/Sub), here each interaction follows the **Command/Reply** pattern:

- The orchestrator sends a **command** to a destination queue
- The worker processes it and sends the **result** back to a reply queue
- The orchestrator decides the next step based on the result

---

## Diagram — Full Flow (Happy Path + Compensations)

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

## Diagram — Queue Architecture (Command/Reply)

```mermaid
flowchart LR
    subgraph Orchestrator["Orchestrator (orders-service)"]
        O[Orders Service]
    end

    subgraph Commands["Command Queues"]
        Q1[order-items-reservation-queue]
        Q3[order-payment-queue]
        Q5[order-send-to-deliver-queue]
        Q6[order-receive-loyalty-points-queue]
        Q7[order-items-undo-reservation-queue]
    end

    subgraph Results["Result Queues"]
        Q2[order-items-reservation-result-queue]
        Q4[order-payment-result-queue]
    end

    subgraph Workers["Workers"]
        S[Stock Service]
        P[Payments Service]
        L[Loyalty Service]
    end

    O -->|"Command: reserve items"| Q1
    O -->|"Command: process payment"| Q3
    O -->|"Command: send to delivery"| Q5
    O -->|"Command: calculate points"| Q6
    O -->|"Compensation: undo reservation"| Q7

    Q1 --> S
    Q3 --> P
    Q5 --> S
    Q6 --> L
    Q7 --> S

    S -->|"Result: reservation"| Q2
    P -->|"Result: payment"| Q4

    Q2 --> O
    Q4 --> O
```

---

## Diagram — Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> waiting_payment: Order created

    waiting_payment --> reserving_items: Command sent to<br/>order-items-reservation-queue

    reserving_items --> unavailable_items: Result: success=false
    reserving_items --> payment_processing: Result: success=true<br/>→ Command sent to<br/>order-payment-queue

    payment_processing --> payment_failed: Result: success=false<br/>→ Compensation: undo reservation
    payment_processing --> payment_succeeded: Result: success=true<br/>→ Commands: deliver + loyalty

    unavailable_items --> [*]
    payment_failed --> [*]
    payment_succeeded --> [*]
```

---

## Diagram — Producer/Consumer Matrix by Service

```mermaid
flowchart TB
    subgraph orders-service["orders-service (Orchestrator)"]
        direction TB
        OP["Publishes to:<br/>• order-items-reservation-queue<br/>• order-payment-queue<br/>• order-items-undo-reservation-queue<br/>• order-send-to-deliver-queue<br/>• order-receive-loyalty-points-queue"]
        OC["Consumes from:<br/>• order-items-reservation-result-queue<br/>• order-payment-result-queue"]
    end

    subgraph stock-service["stock-service (Worker)"]
        direction TB
        SP["Publishes to:<br/>• order-items-reservation-result-queue"]
        SC["Consumes from:<br/>• order-items-reservation-queue<br/>• order-items-undo-reservation-queue<br/>• order-send-to-deliver-queue"]
    end

    subgraph payments-service["payments-service (Worker)"]
        direction TB
        PP["Publishes to:<br/>• order-payment-result-queue"]
        PC["Consumes from:<br/>• order-payment-queue"]
    end

    subgraph loyalty-service["loyalty-service (Worker)"]
        direction TB
        LC["Consumes from:<br/>• order-receive-loyalty-points-queue"]
        LN["Publishes to: no queues"]
    end
```

---

## Detailed Step-by-Step Flow

### 1. Start — Client Requests Payment

The client sends a `POST /v1/orders/payments` request with `orderUuid` and `paymentMethodUuid`. The **orders-service** (orchestrator) validates that the order exists and has status `waiting_payment`, sends a reservation command to the `order-items-reservation-queue` queue, and updates the order status to `reserving_items`.

### 2. Item Reservation (Stock Service)

The **stock-service** consumes the `order-items-reservation-job` job. For each order item, within a transaction with a pessimistic lock:

- Checks if there is sufficient stock (`quantityInStock >= requested quantity`)
- Decrements `quantityInStock`
- Creates an `item_reservation` record

**Success:** Publishes `order-items-reservation-result-job` to the result queue with `success: true` and `reservationUuids[]`.
**Failure:** Rolls back the entire transaction and publishes result with `success: false` and `failedItems[]`.

### 3. Orchestrator Processes Reservation Result

The **orders-service** consumes the result from the `order-items-reservation-result-queue` queue:

- **`success: true`** → Sends payment command to `order-payment-queue` with `totalPrice` and updates status to `payment_processing`
- **`success: false`** → Updates status to `unavailable_items` and the saga ends (no compensation needed)

### 4. Payment Processing (Payments Service)

The **payments-service** consumes the `order-payment-job` job. Creates a payment record with status `pending` and processes it:

- Checks for duplicates (same `userUuid` + `orderUuid` + `paymentMethodUuid`)
- If `paymentMethodUuid` is the failure test UUID (`ff1a8411-b443-408f-8012-fa62eb9067bd`), marks it as `failed`
- Otherwise, marks it as `completed`

**Success:** Publishes `payment-result-job` to the result queue with `success: true`.
**Failure:** Publishes result with `success: false` and `reason`.

### 5. Orchestrator Processes Payment Result

The **orders-service** consumes the result from the `order-payment-result-queue` queue:

#### Successful Payment (`success: true`)

The orchestrator updates status to `payment_succeeded` and dispatches two commands in parallel:

| Queue                                | Target Service  | Action                                                                              |
| ------------------------------------ | --------------- | ----------------------------------------------------------------------------------- |
| `order-send-to-deliver-queue`        | stock-service   | Creates `item_delivery` records with delivery forecast and removes `item_reservation` |
| `order-receive-loyalty-points-queue` | loyalty-service | Calculates points `floor(totalPrice × 0.25)` and creates `loyalty_point` record     |

#### Failed Payment (`success: false`)

The orchestrator updates status to `payment_failed` and dispatches the **compensation**:

| Queue                                | Target Service  | Action (Compensation)                                       |
| ------------------------------------ | --------------- | ----------------------------------------------------------- |
| `order-items-undo-reservation-queue` | stock-service   | Restores `quantityInStock` and removes `item_reservation`   |

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
