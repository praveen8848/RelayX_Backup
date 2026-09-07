# Concurrent Relay Workers in RelayX

## 1. Introduction

In a production environment, a single relay worker may not be enough to keep up with the volume of events being produced. To scale horizontally, we can run multiple instances of the relay service, each polling the outbox table and publishing events to Kafka. However, without proper coordination, multiple workers could pick the same event, leading to duplicate processing or wasted effort.

RelayX solves this using PostgreSQL's **`FOR UPDATE SKIP LOCKED`** feature. This document explains:

- Why concurrency is needed
- The problem of concurrent polling
- How `SKIP LOCKED` works
- Implementation details in RelayX
- Testing concurrency with multiple instances

## 2. Why Concurrency?

The outbox table can contain thousands of `PENDING` events, especially after a Kafka outage or a burst of orders. A single relay worker processes events sequentially (or in small batches). If the polling interval is short, the worker may spend most of its time polling and publishing, but there is a limit to throughput.

Running multiple relay workers concurrently allows events to be processed in parallel, increasing throughput and reducing the time between event creation and delivery to Kafka.

## 3. The Problem: Race Conditions

Imagine two relay workers both execute the same query:

```sql
SELECT * FROM outbox_events
WHERE status = 'PENDING'
ORDER BY created_at ASC
LIMIT 10;
```

Without any locking, both workers may read the same set of events. They will then both attempt to publish each event, causing:

* Duplicate messages to Kafka.
* Both workers marking the same event as `PUBLISHED` (wasted work).
* Potential database updates overwriting each other.

To avoid this, we need a way for each worker to **claim** a batch of events exclusively.

## 4. Solution: PostgreSQL `FOR UPDATE SKIP LOCKED`

PostgreSQL provides row-level locking through `SELECT ... FOR UPDATE`. When a transaction locks rows, other transactions attempting to lock the same rows will wait until the first transaction commits or rolls back.

**`SKIP LOCKED`** is an extension that tells PostgreSQL to **skip rows that are already locked** by another transaction instead of waiting.

This is ideal for job-queue-like scenarios: each worker can select a batch of unprocessed events and lock them, while other workers skip those rows and pick the next available ones.

### 4.1 How It Works

1. **Worker A** starts a transaction and runs:

```sql
SELECT *
FROM outbox_events
WHERE status = 'PENDING'
  AND (next_retry_at IS NULL OR next_retry_at <= now())
ORDER BY created_at ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

Worker A locks 10 events.

2. **Worker B** runs the same query in its own transaction. Because the first 10 rows are locked by Worker A, PostgreSQL skips them and returns the next 10 unlocked events.

3. **Worker A** processes its events, updates their status, and commits. The locks are released.

4. **Worker B** continues processing its batch without conflict.

This ensures that **no two workers process the same event at the same time**.

## 5. Implementation in RelayX

### 5.1 Repository Method

We add a native query to `OutboxEventRepository`:

```java
@Query(value = "SELECT * FROM outbox_events " +
       "WHERE status = 'PENDING' " +
       "AND (next_retry_at IS NULL OR next_retry_at <= :now) " +
       "ORDER BY created_at ASC " +
       "LIMIT :limit " +
       "FOR UPDATE SKIP LOCKED", nativeQuery = true)
List<OutboxEvent> findDueEventsForUpdate(
        @Param("now") LocalDateTime now,
        @Param("limit") int limit);
```

This query is executed within the relay's transaction, and the locks are held until the transaction ends, after processing all events in the batch.

### 5.2 Relay Service Transaction

The `relayPendingEvents` method is annotated with `@Transactional`.

The sequence is:

1. Begin transaction.
2. Call `findDueEventsForUpdate` to fetch and lock a batch of events.
3. For each event:

    * Publish to Kafka.
    * On success, mark as `PUBLISHED`.
    * On failure, apply retry logic:

        * Update `retry_count`.
        * Schedule `next_retry_at`.
        * Or move the event to `DEAD`.
4. Commit the transaction and release the locks.

This ensures that the entire batch is processed atomically with respect to locking.

If any event fails, the transaction is **not rolled back**. Instead, the failure is handled by updating the event's state. The locks are released when the transaction completes.

### 5.3 Configuration

The batch size (`relay.batch-size`) controls how many events a worker claims at once.

The polling interval (`relay.poll-interval-ms`) determines how often the worker checks for new events.

Example `application.yml`:

```yaml
relay:
  poll-interval-ms: 3000
  batch-size: 10
```

Multiple workers can be started by running multiple instances of the Spring Boot application, for example, on different ports while using the same PostgreSQL database and Kafka cluster.

## 6. Testing Concurrency

### 6.1 Single Instance (Baseline)

* Start one application instance.
* Create a burst of orders.
* Observe that events are processed sequentially or in batches by the single worker.
* Verify that all events eventually become `PUBLISHED`.

### 6.2 Multiple Instances

To test concurrency, run two or more application instances that point to the same PostgreSQL database and Kafka cluster.

**Steps:**

1. Start Kafka and PostgreSQL.
2. Start instance 1 on port `8080`.
3. Start instance 2 on port `8081` or use different Spring profiles.
4. Create a large number of orders quickly, for example, 50 orders using a script.
5. Watch the logs of both instances. Each instance should process different events concurrently.
6. Verify that the same event ID does not appear as being processed by both instances.
7. Query the database:

```sql
SELECT status, COUNT(*)
FROM outbox_events
GROUP BY status;
```

Eventually, all successfully processed events should become `PUBLISHED`.

### 6.3 Verifying No Duplicate Processing

Even if two workers accidentally picked the same event, the **idempotency mechanism from Phase 6** ensures that the consumer processes each event only once.

However, `SKIP LOCKED` prevents duplicate publishing at the relay level, reducing unnecessary load on Kafka and downstream consumers.

## 7. Limitations and Considerations

* **Database load:** `FOR UPDATE SKIP LOCKED` still requires the database to scan and lock rows. Proper indexing on `(status, next_retry_at)` is essential for performance.

* **Transaction duration:** Holding locks for the entire batch processing, including Kafka publishing, means the transaction remains open longer. If Kafka is slow, locks are held longer, which can reduce concurrency. This is generally acceptable for moderate batch sizes.

* **Deadlocks:** `SKIP LOCKED` significantly reduces lock contention because workers skip locked rows instead of waiting for them. However, it is more precise to say that it avoids the particular waiting pattern caused by workers competing for the same queue rows; it does not make every possible database deadlock impossible.

* **Multiple databases:** This approach works with PostgreSQL and other databases that support `SKIP LOCKED`, such as Oracle. For databases without equivalent functionality, alternative strategies such as optimistic locking with version numbers can be used.
