# Failure Simulation

This document describes how RelayX handles common failure scenarios and how to test them.

## 1. Kafka Down

When Kafka is unavailable, the relay attempts to publish outbox events but fails. The event remains in `PENDING` status. Once Kafka is back, the relay retries automatically.

**Test steps:**
- Stop Kafka (`docker-compose stop kafka`).
- Create an order.
- Observe the event stays `PENDING`.
- Start Kafka (`docker-compose start kafka`).
- The relay publishes the event and marks it `PUBLISHED`.

## 2. Database Transaction Rollback

If an error occurs after saving the business entity but before saving the outbox event, the entire transaction rolls back. No partial data is left.

**Test endpoint:** `POST /simulate/db-rollback`
- The endpoint saves an order and then throws an exception.
- Verify that neither the order nor the outbox event exists in the database.

## 3. Application Crash

If the application crashes after the order and outbox event are saved but before the event is published, the event remains `PENDING`. On restart, the relay will process it.

**Test steps:**
- Create an order and immediately kill the application (before relay runs).
- Restart the application.
- The relay will pick up the `PENDING` event and publish it.

## Why This Works

The transactional outbox pattern ensures that the business data and the outbox event are always stored atomically. The relay is idempotent by nature (it only processes `PENDING` events), and failures are retried. This gives **at-least-once** delivery semantics, which we handle downstream with idempotent consumers.