# Retry Engine with Exponential Backoff and Dead Letter Queue

## Overview

The RelayX relay is responsible for delivering outbox events to Kafka. Because Kafka may be temporarily unavailable, the relay must retry failed deliveries. This document describes the retry engine, which ensures at-least-once delivery without overwhelming the system.

## Retry Policy

- **Exponential backoff**: The delay between retries doubles after each failure.
- **Jitter**: A random factor (50%–100%) is applied to the calculated delay to prevent synchronized retries from multiple events.
- **Maximum retry limit**: Once the retry count reaches `maxRetryCount`, the event is moved to the Dead Letter Queue (DLQ) with status `DEAD`.

## State Machine
````
PENDING
│
├──> (success) PUBLISHED
│
└──> (failure) retry_count < max
│
├──> schedule next_retry_at (backoff)
│
└──> (after max retries) DEAD

````

## Configuration

The following properties control the retry behavior (in `application.yml`):

```yaml
relay:
  retry:
    base-delay-ms: 1000      # initial delay for first retry
    max-delay-ms: 60000      # maximum delay cap
    max-attempts: 5          # total attempts before DLQ
  poll-interval-ms: 5000     # how often the relay checks for due events

```
- **base-delay-ms**: The delay after the first failure.

- **max-delay-ms**: Upper limit for the exponential backoff.

- **max-attempts**: Number of total attempts (including the original attempt) before an event is declared DEAD.

## How It Works

1. The relay queries for `PENDING` events where `nextRetryAt` is `null` or `<= now`.

2. For each event, it attempts to publish to Kafka.

3. On success, the event is marked `PUBLISHED` and `publishedAt` is set.

4. On failure:

    * `retryCount` is incremented.
    * `lastError` is updated with the error message.
    * If `retryCount >= maxRetryCount`, the status becomes `DEAD`.
    * Otherwise, `nextRetryAt` is calculated using the following formula:

   ```text
   delay = baseDelay * 2^(retryCount-1) * jitter
   ```

   Where:

    * `baseDelay` is the initial retry delay.
    * `retryCount` is the current retry attempt.
    * `jitter` is a random value between `0.5` and `1.0`.
    * The calculated delay is capped at `maxDelay`.

5. The event is saved within the same transaction as the polling operation, and the relay continues processing.

## Dead Letter Queue (DLQ)

Events that exceed the maximum retry count are moved to the **Dead Letter Queue (DLQ)**. They are not automatically retried and require manual intervention through the API.

### DLQ API

| Method   | Endpoint              | Description                                                                     |
| -------- | --------------------- | ------------------------------------------------------------------------------- |
| `GET`    | `/api/dlq`            | List all dead events.                                                           |
| `POST`   | `/api/dlq/{id}/retry` | Reset a dead event to `PENDING` with `retryCount = 0` and `nextRetryAt = null`. |
| `DELETE` | `/api/dlq/{id}`       | Permanently discard a dead event.                                               |

When a dead event is manually retried, the relay will pick it up and attempt delivery again.

## Testing the Retry Engine

Follow these steps to verify the retry mechanism:


1. **Stop Kafka** to simulate a message publishing failure.


2. Create a new order.


3. Observe that the corresponding event remains in `PENDING` status.


4. On each polling attempt:

    * `retryCount` increases.
    * `lastError` is updated.
    * `nextRetryAt` is scheduled for a future time.


5. Verify that `nextRetryAt` grows exponentially between retry attempts.


6. After reaching `maxRetryCount`, the event status changes to `DEAD`.


7. **Start Kafka** again.

8. Manually retry the dead event using the DLQ API:

   ```http
   POST /api/dlq/{id}/retry
   ```

9. The event is reset to `PENDING`.


10. The relay picks up the event and publishes it to Kafka.


11. Verify that the event status changes to `PUBLISHED` and `publishedAt` is populated.



## Summary of Phase 4 Changes

- Added `nextRetryAt`, `maxRetryCount` to `OutboxEvent`.
- Updated `RelayService` to handle backoff and DLQ.
- Extended repository with `findDueEvents` and `resetEventForRetry`.
- Added `DeadLetterController` for DLQ management.
- Updated configuration and documentation.

You can now test the retry behavior by stopping Kafka and observing the backoff and DLQ transition. After Kafka restarts, you can manually retry dead events via the API.

Let me know if you need any further adjustments.