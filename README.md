# Microservices Saga Pattern

A hands-on implementation of the **Saga** pattern for distributed transaction management in microservices, featuring two approaches: **Choreographed** and **Orchestrated**.

## Business Scenario

An order payment flow involving 4 microservices:

| Service              | Responsibility                              |
| -------------------- | ------------------------------------------- |
| **orders-service**   | Order management and status control         |
| **stock-service**    | Stock reservation, deliveries, and inventory control |
| **payments-service** | Payment processing                          |
| **loyalty-service**  | Loyalty points program                      |

The full flow is: **create order → reserve stock → process payment → register delivery + calculate loyalty points**, with automatic compensations on failure.

---

## Projects

### 1. Choreographed Saga (`choreographed-saga/`)

Each service publishes and reacts to **domain events** independently, without a central coordinator. Coordination emerges from the choreography between services.

- **Communication:** Redis Pub/Sub (channels: `order-events`, `stock-events`, `payment-events`)
- **Pattern:** Publish/Subscribe — services publish events and multiple consumers react
- **Compensation:** Services independently react to failure events (e.g., stock-service listens to `PAYMENT_FAILED` and undoes the reservation)
- **Full documentation:** [`choreographed-saga/@docs/choreographed-saga-flow.md`](choreographed-saga/@docs/choreographed-saga-flow.md)

```
Client → Orders (START_ORDER_PAYMENT)
           → Stock (RESERVATION_SUCCEED / RESERVATION_FAILED)
              → Payments (PAYMENT_SUCCEED / PAYMENT_FAILED)
                 → Orders (updates status)
                 → Stock (delivers or undoes reservation)
                 → Loyalty (calculates points)
```

### 2. Orchestrated Saga (`orchestrated-saga/`)

The **orders-service** acts as a central orchestrator, controlling the entire flow imperatively through command and result queues.

- **Communication:** BullMQ (Redis queues with workers)
- **Pattern:** Command/Reply — orchestrator sends commands and receives results
- **Compensation:** Orchestrator sends an explicit undo command (e.g., publishes to the `order-items-undo-reservation-queue` queue)
- **Full documentation:** [`orchestrated-saga/@docs/orchestrated-saga-flow.md`](orchestrated-saga/@docs/orchestrated-saga-flow.md)

```
Client → Orders (orchestrator)
           → [queue] Stock: reserve items → [result queue] Orders
           → [queue] Payments: process payment → [result queue] Orders
           → [queue] Stock: send to delivery
           → [queue] Loyalty: calculate points
```

---

## Comparison Between Approaches

| Aspect                    | Choreographed                       | Orchestrated                        |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| **Flow control**          | Distributed across all services     | Centralized in orders-service       |
| **Message broker**        | Redis Pub/Sub (channels)            | BullMQ (Redis queues)               |
| **Communication**         | Publish/Subscribe (events)          | Command/Reply (request-response)    |
| **Compensation**          | Services react to failure events    | Orchestrator sends undo command     |
| **Coupling**              | Services know each other's events   | Workers are unaware of each other   |
| **Flow visibility**       | Distributed across consumers        | Centralized in a single place       |
| **Single point of failure** | None                              | Orchestrator can be a bottleneck    |
| **Complexity**            | Flow is hard to trace               | Flow is easy to understand          |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

---

## How to Run

### Choreographed Saga

```bash
cd choreographed-saga
docker compose up --build
```

### Orchestrated Saga

```bash
cd orchestrated-saga
docker compose up --build
```

> **Note:** Both projects use the same ports, so run only one at a time, or stop the first one before starting the second.

### Stop the services

```bash
docker compose down
```

To also remove volumes (database data):

```bash
docker compose down -v
```

---

## Service Ports

| Service          | Host Port  |
| ---------------- | ---------- |
| stock-service    | `3000`     |
| orders-service   | `3001`     |
| payments-service | `3002`     |
| loyalty-service  | `3003`     |
| PostgreSQL       | `5432`     |
| Redis            | `6379`     |

---

## Testing the Flow

After starting the containers, trigger the payment flow:

```bash
curl -X POST http://localhost:3001/v1/orders/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderUuid": "e2887507-664e-4469-abfc-e17943d13a5b",
    "paymentMethodUuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  }'
```

To simulate a **payment failure** (compensation), use the test payment method UUID:

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
- **Database:** PostgreSQL 18
- **Message Broker:** Redis 8
- **Package Manager:** pnpm
- **Containerization:** Docker Compose
