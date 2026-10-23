# RelayX

**Reliable event delivery without distributed transactions.**

RelayX is a reliability-focused event-delivery platform that demonstrates how to coordinate database changes and message publication using the **Transactional Outbox Pattern**. It stores business data and the corresponding event in the same PostgreSQL transaction, then uses a relay worker to publish pending events to Apache Kafka.

The project explores practical distributed-systems concerns including **at-least-once delivery, retry scheduling with exponential backoff and jitter, dead-letter handling, idempotent consumption, per-aggregate ordering, concurrent relay workers, multi-tenant API access, and operational metrics**.

> **Delivery guarantee:** RelayX uses at-least-once delivery. Consumers must be idempotent because a message can be published more than once. This avoids claiming end-to-end exactly-once delivery across PostgreSQL and Kafka.

## Table of Contents

- [The Problem](#the-problem)
- [How RelayX Solves It](#how-relayx-solves-it)
- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Demo Walkthrough](#demo-walkthrough)
- [Failure Handling](#failure-handling)
- [Observability](#observability)
- [Design Trade-offs](#design-trade-offs)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)

## The Problem

In an event-driven application, a business operation often needs to perform two writes:

1. Persist business data—for example, create an order in PostgreSQL.
2. Publish an event—for example, `OrderCreated`—so other services can react.

A naïve implementation might look like this:

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);          // Database write
    kafkaTemplate.send("orders", order); // Message-broker write
}
```

This is known as the **dual-write problem**. A local database transaction does not automatically make a write to PostgreSQL atomic with a write to Kafka. The two systems can therefore become inconsistent.

| Failure scenario | Possible outcome |
|---|---|
| Database commit succeeds, but Kafka publication fails | The order exists, but downstream services never receive its event. |
| Kafka publication succeeds, but the database transaction rolls back | Consumers receive an event for business data that does not exist. |
| The application crashes between the two operations | The final state depends on which operation completed first. |

Distributed transactions such as XA/two-phase commit can coordinate participating systems, but they add operational complexity and are not a practical fit for every modern event-driven architecture. RelayX demonstrates an alternative that keeps the business write and event record atomic within a single database transaction.

## How RelayX Solves It

RelayX implements the **Transactional Outbox Pattern**:

1. The application writes the business record and its corresponding event to PostgreSQL in the **same transaction**.
2. Both writes commit together or roll back together. This prevents a committed business change from being separated from its outbox record.
3. A separate relay worker polls the outbox table for eligible `PENDING` events and publishes them to Kafka.
4. Successful publications are marked `PUBLISHED`. Failed attempts are rescheduled using exponential backoff and jitter.
5. Events that exceed the configured retry limit are moved to the dead-letter state (`DEAD`) for inspection and possible manual retry.
6. Consumers use a stable `eventId` and a `processed_events` table to detect duplicate deliveries and avoid repeating the same business effect.

```text
Client
  |
  v
POST /api/orders
  |
  v
+----------- One PostgreSQL transaction -----------+
|  INSERT order                                    |
|  INSERT outbox event                             |
+--------------------------------------------------+
  |
  | commit
  v
Relay worker ---> Apache Kafka ---> Idempotent consumer
      |
      +---- retry with backoff / dead-letter handling
```

The pattern makes the database change and event record atomic. Publication is asynchronous, so delivery is **eventual rather than instantaneous** and depends on the relay, broker, and retry configuration being operational.

## Features

### Reliability and delivery

- **Transactional outbox:** Stores the business change and its event record in one database transaction.
- **At-least-once delivery:** Retries failed publication attempts; consumers must safely handle duplicates.
- **Exponential backoff with jitter:** Spreads retry attempts and reduces synchronized retry spikes.
- **Dead-letter queue (DLQ):** Isolates events that exceed the retry limit and supports inspection, retry, or discard operations.
- **Idempotent consumer:** Uses a unique event ID and `processed_events` records to suppress duplicate processing.
- **Per-aggregate ordering:** Uses sequence numbers to preserve event order for an individual aggregate, where configured.
- **Crash recovery:** Pending events can be picked up again after a relay restart.

### Concurrency and throughput

- **Concurrent relay workers:** Uses PostgreSQL `FOR UPDATE SKIP LOCKED` to let workers claim separate rows without waiting on rows already claimed by another worker.
- **Batched polling:** Processes a configurable number of events per polling cycle.
- **Configurable retries:** Supports a base delay, maximum delay, and maximum attempt count.

### Multi-tenancy

- **Projects:** Associates tenant activity with a project and its API key.
- **API-key authentication:** Supports Bearer-token authentication through a custom API-key filter.
- **Tenant-scoped events:** Associates outbox events with a `projectId`.
- **Tenant publish endpoint:** Allows external clients to submit events through the RelayX API.

### Observability

- **Spring Boot Actuator:** Exposes application health and metrics endpoints.
- **Micrometer metrics:** Tracks event totals, successful publications, failed attempts, retries, queue size, and delivery latency.
- **Prometheus/Grafana integration:** A local monitoring stack can be run with Docker Compose when its configuration is included and enabled.

### Developer experience

- **Interactive frontend:** Provides a UI for the dashboard, event explorer, retry/DLQ workflows, project management, and pipeline visualization.
- **Failure-simulation endpoints:** Demonstrate scenarios such as a simulated Kafka outage, transaction rollback, duplicate delivery, and recovery.
- **REST API:** Provides endpoints for orders, events, projects, relay status, metrics, and dead-letter operations.

## Architecture

### Request and event flow

```text
                         +---------------------------+
                         |           Client          |
                         |    REST API / Frontend    |
                         +-------------+-------------+
                                       |
                                       v
                         +---------------------------+
                         |          RelayX API       |
                         |        Spring Boot        |
                         |                           |
                         |  Order module             |
                         |  Outbox module            |
                         |  Relay module             |
                         |  Project / tenant module  |
                         |  Event ingestion module   |
                         +-------------+-------------+
                                       |
                         +-------------+-------------+
                         |                           |
                         v                           v
               +------------------+        +------------------+
               |    PostgreSQL    |        |      Kafka       |
               |                  |        |                  |
               | orders            |        | order-events     |
               | outbox_events     |        +---------+--------+
               | processed_events  |                  |
               | projects          |                  v
               | aggregate_sequences|       +------------------+
               +------------------+        | Idempotent       |
                                           | consumer         |
                                           +------------------+

                         Metrics: Actuator / Micrometer
                         Optional local stack: Prometheus + Grafana
```

### Main components

- **Order module:** Handles order creation and retrieval.
- **Outbox module:** Persists and queries event records.
- **Relay module:** Polls eligible events, publishes them to Kafka, and coordinates retry/DLQ state transitions.
- **Project module:** Manages tenant projects and their API keys.
- **Ingestion module:** Accepts events submitted by tenant clients.
- **Consumer:** Demonstrates duplicate detection using event IDs and a processed-event record.

## Database Schema

The core schema is organized around the following tables. Exact columns may vary as the implementation evolves.

### `orders`

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` primary key | Order identifier |
| `customer_id` | `VARCHAR` | Customer identifier |
| `amount` | `NUMERIC(10,2)` | Order amount |
| `status` | `VARCHAR(50)` | Order status |
| `created_at` | `TIMESTAMP` | Creation time |

### `outbox_events`

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` primary key | Internal row identifier |
| `event_id` | `VARCHAR(36)`, unique | Stable event identifier |
| `aggregate_type` | `VARCHAR(100)` | Aggregate type, such as `Order` |
| `aggregate_id` | `BIGINT` | Aggregate identifier |
| `event_type` | `VARCHAR(100)` | Event name, such as `OrderCreated` |
| `topic` | `VARCHAR(100)` | Kafka topic |
| `payload` | `TEXT` | Serialized event payload |
| `status` | `VARCHAR(20)` | Delivery state |
| `project_id` | `BIGINT` | Tenant/project association |
| `sequence_number` | `INT` | Per-aggregate sequence number |
| `retry_count` | `INT` | Number of attempts/retries recorded |
| `max_retry_count` | `INT` | Maximum configured attempts |
| `next_retry_at` | `TIMESTAMP` | Earliest scheduled retry time |
| `last_error` | `TEXT` | Most recent publication error |
| `created_at` | `TIMESTAMP` | Event-record creation time |
| `published_at` | `TIMESTAMP` | Successful publication time |

### `processed_events`

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` primary key | Internal row identifier |
| `event_id` | `VARCHAR(36)`, unique | Duplicate-detection key |
| `processed_at` | `TIMESTAMP` | Processing time |

### `projects`

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` primary key | Project identifier |
| `name` | `VARCHAR(100)`, unique | Project name |
| `api_key` | `VARCHAR(64)`, unique | API credential |
| `created_at` | `TIMESTAMP` | Creation time |

### `aggregate_sequences`

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` primary key | Internal row identifier |
| `aggregate_type` | `VARCHAR(100)` | Aggregate type |
| `aggregate_id` | `BIGINT` | Aggregate identifier |
| `last_sequence` | `INT` | Last allocated sequence number |

A unique constraint on `(aggregate_type, aggregate_id)` prevents more than one sequence-tracking row for the same aggregate.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17+ |
| Backend framework | Spring Boot 4.x |
| Persistence | Spring Data JPA, Hibernate, PostgreSQL 16 |
| Messaging | Apache Kafka (Confluent Platform 7.5.0 in the supplied configuration) |
| Security | Spring Security, custom API-key filter |
| Metrics | Spring Boot Actuator, Micrometer, Prometheus |
| Database concurrency | PostgreSQL `FOR UPDATE SKIP LOCKED` |
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Query, Recharts |
| Containerization | Docker, Docker Compose |
| Build tool | Maven |

> Check the repository's `pom.xml`, `package.json`, and Docker Compose configuration before publishing this README to ensure the versions above match the current codebase.

## Getting Started

### Prerequisites

- Java 17 or later (use the version required by the current `pom.xml`)
- Maven 3.8+
- Docker and Docker Compose
- Node.js 18+ and npm for the frontend

### 1. Clone the repository

Replace the placeholder with the actual repository URL if you are sharing this README publicly.

```bash
git clone https://github.com/<your-username>/relayx.git
cd relayx
```

### 2. Start the infrastructure

```bash
docker compose up -d
```

This starts the services defined in the repository's Compose file, including PostgreSQL and Kafka (and any supporting broker services configured there).

### 3. Run the backend

From the repository root:

```bash
mvn spring-boot:run
```

The application is expected to listen on `http://localhost:8080` with the default local configuration.

Check application health:

```bash
curl http://localhost:8080/actuator/health
```

Expected response when the application is healthy:

```json
{
  "status": "UP"
}
```

### 4. Run the frontend

The frontend is located in the repository's `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. If your local checkout uses a different frontend directory, use that directory instead.

### 5. Seed demo data

```bash
curl -X POST http://localhost:8080/simulate/seed
```

This endpoint seeds sample events in different delivery states so the dashboard and event-management pages have data to display.

## API Reference

The endpoints below reflect the supplied project notes. Confirm paths, request fields, and authorization rules against the current controllers before treating this table as a formal API contract.

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Creates an order and its outbox event atomically. |
| `GET` | `/api/orders/{id}` | Retrieves an order by ID. |

Example request:

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"cust-1","amount":100.00}'
```

Example response:

```json
{
  "id": 5,
  "customerId": "cust-1",
  "amount": 100.00,
  "status": "CREATED",
  "createdAt": "2026-09-10T14:10:00",
  "outboxEventCreated": true,
  "outboxEventId": 42
}
```

The values above are illustrative; IDs and timestamps will differ in a real response.

### Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | Searches events with filters and pagination. |
| `POST` | `/api/events` | Accepts an event from a tenant; requires an API key. |

Supported query parameters for `GET /api/events` include `status`, `aggregateType`, `fromDate`, `toDate`, `page`, and `size`.

Example tenant event submission:

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer relay_live_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "aggregateType": "Order",
    "aggregateId": 42,
    "eventType": "OrderCreated",
    "topic": "order-events",
    "payload": "{\"orderId\":42}"
  }'
```

Example response:

```json
{
  "eventId": "58dcfa60-f34c-4bc2-b2af-ba373973f264",
  "status": "accepted"
}
```

Use a real API key created for your local project. Do not commit API keys or other credentials to source control.

### Dead Letter Queue

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dlq` | Lists events in the `DEAD` state. |
| `POST` | `/api/dlq/{id}/retry` | Resets a dead event to `PENDING` for another attempt. |
| `DELETE` | `/api/dlq/{id}` | Permanently discards an event. |

### Projects and multi-tenancy

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | Lists projects. |
| `POST` | `/api/projects?name=TenantA` | Creates a project and returns its API key. |

### Dashboard and relay

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/metrics` | Returns aggregate dashboard counts. |
| `GET` | `/api/relay/status` | Returns relay status, pending count, batch information, and last-poll details. |
| `GET` | `/api/outbox/pending` | Lists pending events. |
| `GET` | `/api/outbox/stats` | Returns pending-event statistics. |

### Simulation and demo endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/simulate/seed` | Seeds sample events with mixed states. |
| `POST` | `/simulate/bulk?count=N` | Generates a batch of events for load demonstration. |
| `POST` | `/simulate/ordering-demo?customerId=x` | Creates a sequence of events for one aggregate. |
| `POST` | `/simulate/duplicate/{eventId}` | Triggers a duplicate-delivery scenario. |
| `POST` | `/simulate/db-rollback` | Demonstrates transaction rollback behavior. |
| `POST` | `/simulate/kafka-down` | Enables the configured Kafka-outage simulation. |
| `POST` | `/simulate/kafka-up` | Disables the Kafka-outage simulation. |
| `GET` | `/simulate/kafka-status` | Reads the simulation state. |

### Actuator

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/actuator/health` | Application health. |
| `GET` | `/actuator/metrics` | Available metric names and measurements. |
| `GET` | `/actuator/prometheus` | Metrics in Prometheus exposition format. |

## Demo Walkthrough

Use these scenarios to demonstrate the design and its failure-handling behavior. The examples assume the backend is running locally on port `8080` and that the relevant simulation endpoints are enabled.

### 1. Seed sample data

```bash
curl -X POST http://localhost:8080/simulate/seed
```

The supplied demo configuration is intended to seed events across `PUBLISHED`, `PENDING`, and `DEAD` states. The exact counts depend on the implementation.

### 2. Create an order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"demo","amount":100.00}'
```

Inspect the order and its outbox record. The two records should be committed in the same transaction; the relay should publish the event asynchronously when Kafka is available.

### 3. Generate a batch of events

```bash
curl -X POST "http://localhost:8080/simulate/bulk?count=500"
```

Use the dashboard and relay-status endpoints to observe queue depth and batch processing. The supplied notes specify a default batch size of 10; verify the active configuration before relying on that value.

### 4. Demonstrate per-aggregate ordering

```bash
curl -X POST "http://localhost:8080/simulate/ordering-demo?customerId=demo"
```

This scenario is intended to create a sequence such as `Created → Paid → Shipped` for one aggregate. Inspect the resulting sequence numbers and publication order.

### 5. Simulate a Kafka outage and recovery

Enable the simulation:

```bash
curl -X POST http://localhost:8080/simulate/kafka-down
```

Create an order while the simulated broker outage is active:

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"demo","amount":50.00}'
```

Inspect the most recent outbox row in PostgreSQL. For example, if your Compose service and database names match the following command:

```bash
docker exec -it relayx-postgres psql -U postgres -d relayx \
  -c "SELECT id, status, retry_count, next_retry_at, last_error FROM outbox_events ORDER BY id DESC LIMIT 1;"
```

During the simulated outage, the event should remain eligible for retry, the retry count should increase, and the last error should record the failed attempt. Exact error text and retry timing depend on the implementation and configuration.

Recover the simulated broker:

```bash
curl -X POST http://localhost:8080/simulate/kafka-up
```

Once the next eligible retry runs and Kafka is available, the event should be published and its state updated accordingly.

### 6. Demonstrate duplicate handling

```bash
curl -X POST http://localhost:8080/simulate/duplicate/<eventId>
```

Replace `<eventId>` with an actual event ID. Check consumer logs or processed-event records to verify that a repeated event does not repeat the same business effect.

### 7. Inspect and retry dead-letter events

```bash
curl http://localhost:8080/api/dlq
curl -X POST http://localhost:8080/api/dlq/<id>/retry
```

Replace `<id>` with the relevant dead-letter record ID. Retrying a message should be an intentional operational action; inspect its payload and failure reason first.

### 8. Demonstrate database rollback

```bash
curl -X POST http://localhost:8080/simulate/db-rollback
```

Verify that the transaction does not leave a committed order without its corresponding outbox event. If the transaction is rolled back, both writes should be rolled back together.

## Failure Handling

| Scenario | Expected behavior |
|---|---|
| Kafka is unavailable | The event remains pending and is retried according to the backoff policy. |
| Retry limit is exceeded | The event moves to `DEAD` and can be inspected or retried manually. |
| Application stops before publication | The committed outbox record remains available for a worker after restart. |
| Application stops after publication but before marking success | The event may be published again; consumer idempotency is needed to prevent duplicate effects. |
| Database transaction fails | Business data and the outbox record roll back together. |
| Duplicate delivery occurs | The consumer checks `eventId` against processed-event records. |
| Multiple relay workers run concurrently | `FOR UPDATE SKIP LOCKED` helps workers claim different eligible rows. |
| Events for one aggregate compete for publication | Sequence tracking is used to preserve per-aggregate order where implemented. |

### Event state flow

```text
                 +---------+
                 | PENDING |
                 +----+----+
                      |
                 publish attempt
                      |
              +-------+--------+
              |                |
              v                v
        +-----------+       Failure
        | PUBLISHED |          |
        +-----------+          v
                       Retry limit not reached?
                          |             |
                         Yes            No
                          |             |
                          v             v
                 Schedule next retry  +------+
                 (backoff + jitter)  | DEAD |
                                     +------+
```

## Observability

RelayX exposes application and event-delivery metrics through Spring Boot Actuator and Micrometer.

| Metric | Type | Description |
|---|---|---|
| `relay_events_total` | Counter | Total events processed by the relay. |
| `relay_events_success` | Counter | Successful event publications. |
| `relay_events_failed` | Counter | Failed publication attempts. |
| `relay_events_retry` | Counter | Scheduled retries. |
| `event_delivery_latency` | Timer | Time spent publishing an event. |
| `outbox_queue_size` | Gauge | Number of pending events. |

Metric names are implementation-specific; verify the names exposed by `/actuator/prometheus` in the running application.

### Optional local Prometheus and Grafana

If these services are not already present in `docker-compose.yml`, add and configure them for local development. Example Compose services:

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
```

Example `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: relayx
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ["host.docker.internal:8080"]
```

This configuration is intended for local development, not as a hardened production monitoring setup. Review credentials, network exposure, persistence, and resource requirements before deploying monitoring services.

## Design Trade-offs

### At-least-once delivery with idempotent processing

A relay can publish an event successfully and then crash before recording that success in the database. On restart, it may publish the event again. RelayX therefore favors **at-least-once delivery plus idempotent consumer behavior** rather than claiming exactly-once delivery across PostgreSQL and Kafka.

### Polling instead of change data capture (CDC)

Polling is straightforward to implement and requires fewer moving parts. CDC tools such as Debezium can read database-log changes and may reduce polling overhead or latency, but introduce additional infrastructure and operational complexity. CDC is a possible future optimization, not a prerequisite for the outbox pattern.

### `FOR UPDATE SKIP LOCKED` instead of application-managed locks

PostgreSQL row-level locking allows concurrent workers to claim different rows without requiring a separate lock-management service. The query and transaction boundaries still need careful design to avoid holding locks during slow broker calls.

### Per-aggregate ordering instead of global ordering

Global ordering would constrain concurrency across unrelated entities. Per-aggregate ordering preserves the sequence of events for one entity while allowing independent aggregates to progress concurrently. The exact guarantee depends on how sequence numbers, row selection, Kafka partitioning, and retries are implemented.

### Dead-letter handling instead of unlimited retries

Unlimited retries can keep poison messages cycling indefinitely and obscure persistent failures. A DLQ isolates events that need investigation and provides an explicit recovery path.

## Project Structure

The backend and frontend are maintained in the same repository. The following is a representative layout; use the actual directory names in your current branch if they differ.

```text
relayx/
├── src/main/java/com/relayx/
│   ├── common/                  # Configuration, metrics, exceptions, simulation
│   │   ├── config/
│   │   ├── exception/
│   │   ├── metrics/
│   │   ├── security/
│   │   ├── service/
│   │   └── simulation/
│   ├── order/                   # Order domain, controllers, services
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   └── service/
│   ├── outbox/                  # Outbox records and event queries
│   │   ├── controller/
│   │   ├── entity/
│   │   └── repository/
│   ├── relay/                   # Polling, producer, consumer, retry/DLQ logic
│   │   ├── controller/
│   │   ├── consumer/
│   │   ├── producer/
│   │   └── service/
│   ├── project/                 # Projects and API-key management
│   │   ├── controller/
│   │   ├── entity/
│   │   └── repository/
│   ├── ingestion/               # Tenant event-ingestion endpoint
│   │   └── controller/
│   └── RelayxApplication.java
├── src/main/resources/
│   └── application.yml
├── frontend/                    # React + Vite + TypeScript application
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   └── package.json
├── docs/                        # Design and implementation notes
├── docker-compose.yml
├── pom.xml
└── README.md
```

## Documentation

The project notes describe these deep dives under `docs/`:

- `01-dual-write-problem.md` — why naïve dual writes can fail.
- `02-failure-simulation.md` — Kafka outage, database rollback, and crash scenarios.
- `03-retry-engine.md` — exponential backoff and jitter.
- `04-idempotency.md` — at-least-once delivery and duplicate suppression.
- `05-concurrent-relay-workers.md` — concurrent claiming with `SKIP LOCKED`.
- `06-ordering-guarantees.md` — per-aggregate sequencing.
- `07-observability.md` — metrics and dashboards.
- `08-security-multitenancy.md` — API keys and project isolation.

Keep this list aligned with the actual files present in `docs/`.

## Roadmap

Potential next steps include:

- [ ] **Debezium CDC:** Explore log-based outbox processing using PostgreSQL WAL.
- [ ] **PostgreSQL `LISTEN`/`NOTIFY`:** Reduce idle polling latency while retaining a recovery-safe outbox.
- [ ] **Java client SDK:** Simplify event submission from Java services.
- [ ] **Retention policies:** Define cleanup for processed-event records and published outbox rows.
- [ ] **Reusable consumer library:** Provide a standard idempotent-consumer implementation.
- [ ] **Prebuilt Grafana dashboards:** Make key relay and delivery metrics easier to inspect.
- [ ] **Kubernetes Helm chart:** Package deployment configuration for Kubernetes environments.
- [ ] **Multi-region strategy:** Evaluate replication and disaster-recovery requirements.

## License

MIT. Include the repository's `LICENSE` file and confirm that it contains the intended license text before distributing the project.

## Author

**Praveen Verma** — Java and Spring Boot backend development, event-driven architecture, and distributed-systems reliability patterns.

RelayX demonstrates a central principle of reliable event-driven systems: **commit the business change and its event record together; deliver the event asynchronously with retries and idempotent processing.**
