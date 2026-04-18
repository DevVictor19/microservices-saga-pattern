# Choreographed Saga — Event Flow

## Overview

This project implements the **Choreographed Saga** pattern for processing order payments in a microservices architecture. Each service reacts to events published by other services via **Redis Pub/Sub**, without the presence of a central orchestrator.

### Services

| Service              | Port | Responsibility                     |
| -------------------- | ---- | ---------------------------------- |
| **orders-service**   | 3000 | Manages orders and coordinates status |
| **stock-service**    | 3001 | Stock reservation and inventory control |
| **payments-service** | 3002 | Payment processing                 |
| **loyalty-service**  | 3003 | Loyalty points program             |

### Redis Pub/Sub Channels

| Channel          | Producer         | Consumers                                      |
| ---------------- | ---------------- | ---------------------------------------------- |
| `order-events`   | orders-service   | stock-service                                  |
| `stock-events`   | stock-service    | orders-service, payments-service               |
| `payment-events` | payments-service | orders-service, stock-service, loyalty-service |

### Event Types

| Event                 | Channel        | Description                    |
| --------------------- | -------------- | ------------------------------ |
| `START_ORDER_PAYMENT` | order-events   | Payment flow start             |
| `RESERVATION_SUCCEED` | stock-events   | Items reserved successfully    |
| `RESERVATION_FAILED`  | stock-events   | Item reservation failed        |
| `PAYMENT_SUCCEED`     | payment-events | Payment approved               |
| `PAYMENT_FAILED`      | payment-events | Payment declined               |

---

## Diagram — Full Flow (Happy Path + Compensations)

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Orders as Orders Service
    participant Redis as Redis Pub/Sub
    participant Stock as Stock Service
    participant Payments as Payments Service
    participant Loyalty as Loyalty Service

    Note over Client,Loyalty: ═══ HAPPY PATH — Successful Payment ═══

    Client->>Orders: POST /api/v1/orders/payments<br/>{orderUuid, paymentMethodUuid}
    activate Orders
    Orders->>Orders: Validate order (status = waiting_payment)
    Orders->>Redis: Publish START_ORDER_PAYMENT<br/>on channel "order-events"
    Orders->>Orders: Update status → reserving_items
    Orders-->>Client: 200 OK
    deactivate Orders

    Redis->>Stock: Consume START_ORDER_PAYMENT
    activate Stock
    Note over Stock: Wait 10s (simulated)
    Stock->>Stock: For each order item:<br/>- Pessimistic lock on item<br/>- Decrement quantityInStock<br/>- Create item_reservation record
    Stock->>Redis: Publish RESERVATION_SUCCEED<br/>on channel "stock-events"
    deactivate Stock

    par stock-events consumers
        Redis->>Orders: Consume RESERVATION_SUCCEED
        activate Orders
        Orders->>Orders: Update status → payment_processing
        deactivate Orders
    and
        Redis->>Payments: Consume RESERVATION_SUCCEED
        activate Payments
        Note over Payments: Wait 10s (simulated)
        Payments->>Payments: Create payment (status = pending)
        Payments->>Payments: Process payment → completed
        Payments->>Redis: Publish PAYMENT_SUCCEED<br/>on channel "payment-events"
        deactivate Payments
    end

    par payment-events consumers
        Redis->>Orders: Consume PAYMENT_SUCCEED
        activate Orders
        Orders->>Orders: Update status → payment_succeeded ✅
        deactivate Orders
    and
        Redis->>Stock: Consume PAYMENT_SUCCEED
        activate Stock
        Stock->>Stock: Create item_delivery records<br/>(with delivery_forecast)
        Stock->>Stock: Remove item_reservation records
        deactivate Stock
    and
        Redis->>Loyalty: Consume PAYMENT_SUCCEED
        activate Loyalty
        Loyalty->>Loyalty: Calculate points = floor(totalPrice × 0.25)
        Loyalty->>Loyalty: Create loyalty_point record
        deactivate Loyalty
    end

    Note over Client,Loyalty: ═══ COMPENSATION 1 — Item Reservation Failed ═══

    Client->>Orders: POST /api/v1/orders/payments
    activate Orders
    Orders->>Redis: Publish START_ORDER_PAYMENT
    Orders->>Orders: Status → reserving_items
    deactivate Orders

    Redis->>Stock: Consume START_ORDER_PAYMENT
    activate Stock
    Stock->>Stock: Insufficient stock for item
    Stock->>Stock: Transaction rollback (DB)
    Stock->>Redis: Publish RESERVATION_FAILED<br/>on channel "stock-events"<br/>{failedItems}
    deactivate Stock

    Redis->>Orders: Consume RESERVATION_FAILED
    activate Orders
    Orders->>Orders: Update status → unavailable_items ❌
    deactivate Orders
    Note over Payments: Does not react to RESERVATION_FAILED

    Note over Client,Loyalty: ═══ COMPENSATION 2 — Payment Failed ═══

    Note over Stock: (After successful RESERVATION_SUCCEED)

    Redis->>Payments: Consume RESERVATION_SUCCEED
    activate Payments
    Payments->>Payments: Create payment (status = pending)
    Payments->>Payments: Payment declined → failed
    Payments->>Redis: Publish PAYMENT_FAILED<br/>on channel "payment-events"<br/>{reason}
    deactivate Payments

    par payment-events consumers (compensation)
        Redis->>Orders: Consume PAYMENT_FAILED
        activate Orders
        Orders->>Orders: Update status → payment_failed ❌
        deactivate Orders
    and
        Redis->>Stock: Consume PAYMENT_FAILED
        activate Stock
        Stock->>Stock: Restore quantityInStock<br/>(increment back)
        Stock->>Stock: Remove item_reservation records
        deactivate Stock
    end
    Note over Loyalty: Does not react to PAYMENT_FAILED
```

---

## Diagram — Publish and Subscribe Matrix

```mermaid
flowchart LR
    subgraph Producers["Producers"]
        O[Orders Service]
        S[Stock Service]
        P[Payments Service]
    end

    subgraph Channels["Redis Channels"]
        OE[order-events]
        SE[stock-events]
        PE[payment-events]
    end

    subgraph Consumers["Consumers"]
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

## Diagram — Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> waiting_payment: Order created

    waiting_payment --> reserving_items: START_ORDER_PAYMENT published

    reserving_items --> unavailable_items: RESERVATION_FAILED received
    reserving_items --> payment_processing: RESERVATION_SUCCEED received

    payment_processing --> payment_failed: PAYMENT_FAILED received
    payment_processing --> payment_succeeded: PAYMENT_SUCCEED received

    unavailable_items --> [*]
    payment_failed --> [*]
    payment_succeeded --> [*]
```

---

## Detailed Step-by-Step Flow

### 1. Start — Client Requests Payment

The client sends a `POST /api/v1/orders/payments` request with `orderUuid` and `paymentMethodUuid`. The **orders-service** validates that the order exists and has status `waiting_payment`, publishes the `START_ORDER_PAYMENT` event on the `order-events` channel, and updates the order status to `reserving_items`.

### 2. Item Reservation

The **stock-service** consumes the `START_ORDER_PAYMENT` event. For each order item, within a transaction with a pessimistic lock:

- Checks if there is sufficient stock (`quantityInStock >= requested quantity`)
- Decrements `quantityInStock`
- Creates an `item_reservation` record

**Success:** Publishes `RESERVATION_SUCCEED` on the `stock-events` channel.  
**Failure:** Rolls back the entire transaction and publishes `RESERVATION_FAILED` with the list of unavailable items.

### 3. Payment Processing

The **payments-service** consumes `RESERVATION_SUCCEED` from the `stock-events` channel. Creates a payment record with status `pending` and processes the payment:

- Checks for duplicates (same `userUuid` + `orderUuid` + `paymentMethodUuid`)
- If `paymentMethodUuid` is the failure test UUID (`ff1a8411-b443-408f-8012-fa62eb9067bd`), marks it as `failed`
- Otherwise, marks it as `completed`

**Success:** Publishes `PAYMENT_SUCCEED` on the `payment-events` channel.  
**Failure:** Publishes `PAYMENT_FAILED` with the reason.

### 4. Finalization — Reactions to Payment Result

#### Successful Payment (`PAYMENT_SUCCEED`)

| Service             | Action                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **orders-service**  | Updates order status → `payment_succeeded`                                                   |
| **stock-service**   | Creates `item_delivery` records with delivery forecast and removes `item_reservation` records |
| **loyalty-service** | Calculates loyalty points (`floor(totalPrice × 0.25)`) and creates `loyalty_point` record    |

#### Failed Payment (`PAYMENT_FAILED`)

| Service             | Action (Compensation)                                          |
| ------------------- | -------------------------------------------------------------- |
| **orders-service**  | Updates order status → `payment_failed`                        |
| **stock-service**   | Restores `quantityInStock` and removes `item_reservation` records |
| **loyalty-service** | No action                                                      |

---

## Infrastructure

- **Message Broker:** Redis 7 (Pub/Sub via `ioredis`)
- **Database:** PostgreSQL 17 (one database per service)
- **Framework:** NestJS with TypeORM
- **Containerization:** Docker Compose
