# Idempotency in RelayX

## 1. Introduction

RelayX uses the **Transactional Outbox** pattern to guarantee reliable event delivery from a database to a message broker (Kafka). However, this pattern provides **at-least-once** delivery semantics, meaning the same event may be delivered to consumers more than once. To ensure that business operations are not executed multiple times, consumers must be **idempotent**.

This document explains:

- What idempotency means in the context of event-driven systems
- Why duplicates occur despite the outbox pattern
- How RelayX implements idempotency using unique event IDs and a processed-events table
- How to test the behavior

## 2. At-Least-Once Delivery and Duplicates

### 2.1 At-Least-Once Semantics

The transactional outbox guarantees that every event is **eventually** published to Kafka, even if the broker is temporarily unavailable. However, it does not guarantee **exactly-once** delivery. The system is designed to retry failed deliveries, and these retries can produce duplicate messages.

### 2.2 Why Duplicates Occur

Several scenarios can lead to the same event being published more than once:

- **Relay crash after publishing, before updating status**  
  If the relay sends the message to Kafka but crashes before marking the outbox event as `PUBLISHED`, the event remains in `PENDING`. After restart, the relay will pick it up and publish it again.

- **Kafka producer retries**  
  Kafka producers can be configured to retry sends on transient errors. If the broker actually received the message but the acknowledgment was lost, the producer may retry and cause a duplicate.

- **Manual intervention**  
  An operator might reset an event back to `PENDING` (e.g., from the DLQ) to force reprocessing, which will also cause a duplicate.

## 3. The Problem with Non-Idempotent Consumers

Consider a consumer that performs a business operation when receiving an `OrderCreated` event, such as:

- Sending a confirmation email
- Updating a read model
- Calling a downstream service

If the same event is delivered twice, the consumer might:

- Send the email twice
- Apply the update twice (e.g., increment a counter incorrectly)
- Trigger a duplicate API call

This can lead to data inconsistency, user confusion, and unnecessary load on external systems.

## 4. Solution: Idempotent Consumers with Event IDs

RelayX solves the duplicate problem by making consumers idempotent. The approach is simple and robust:

1. Every outbox event is assigned a globally unique `eventId` (UUID).
2. The relay attaches this `eventId` as a **Kafka header** when publishing the event.
3. The consumer, before processing, checks whether it has already seen this `eventId` by looking up a local `processed_events` table.
4. If the `eventId` is already present, the consumer **skips** the message (logs as duplicate).
5. If not, the consumer processes the business logic and inserts a new row into `processed_events` **in the same transaction** as the business logic.

This guarantees that the business logic is executed **exactly once** per event ID, even if the message is delivered multiple times.

## 5. Implementation Details

### 5.1 Outbox Event Entity

A new column `event_id` is added to the `outbox_events` table to store the unique identifier.

```java
@Entity
@Table(name = "outbox_events", ...)
public class OutboxEvent {
    // ...
    @Column(name = "event_id", nullable = false, unique = true, length = 36)
    private String eventId;
    // ...
}
```

When an outbox event is created, the `eventId` is generated using `UUID.randomUUID().toString()`.

### 5.2 Producer: Sending `eventId` as a Kafka Header

The `KafkaEventProducer` creates a `ProducerRecord` and adds the `eventId` as a Kafka header named `eventId`.

```java
public void publish(String topic, String key, String payload, String eventId) {
    ProducerRecord<String, String> record =
            new ProducerRecord<>(topic, key, payload);

    if (eventId != null) {
        record.headers().add(
                new RecordHeader(
                        "eventId",
                        eventId.getBytes(StandardCharsets.UTF_8)
                )
        );
    }

    kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
}
```

### 5.3 Processed Events Table

A new `ProcessedEvent` entity is created to track which events have already been processed.

```java
@Entity
@Table(name = "processed_events")
public class ProcessedEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "event_id",
        nullable = false,
        unique = true,
        length = 36
    )
    private String eventId;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;
}
```

The `event_id` column has a **unique constraint**, ensuring that the same event can be recorded only once.

### 5.4 Consumer: Idempotent Processing

The consumer is implemented using a `@KafkaListener` method. It receives the message along with the `eventId` header.

The processing logic is wrapped in a `@Transactional` method to guarantee atomicity between the business operation and the insertion into `processed_events`.

```java
@KafkaListener(
    topics = "order-events",
    groupId = "relayx-order-consumer"
)
@Transactional
public void consume(
        String message,
        @Header(name = "eventId", required = false) String eventId) {

    if (eventId != null &&
            processedEventRepository.existsByEventId(eventId)) {

        log.info("Duplicate event ignored: {}", eventId);
        return;
    }

    // Execute business logic
    // ...

    // Mark as processed
    if (eventId != null) {
        ProcessedEvent processedEvent = ProcessedEvent.builder()
                .eventId(eventId)
                .build();

        processedEventRepository.save(processedEvent);
    }
}
```

**Atomicity guarantee:** If the business logic throws an exception, the transaction rolls back, and no row is inserted into `processed_events`. The Kafka message can therefore be retried safely without losing the event.
