# The Dual-Write Problem

## What is Dual Write?

Dual-write refers to the scenario where an application needs to write data to two different systems in a single operation. In event-driven architectures, this commonly means:

1. Writing business data to a database (e.g., PostgreSQL)
2. Publishing an event to a message broker (e.g., Kafka)

## The Core Problem

Consider this naive implementation:

```java
@Transactional
public void createOrder(Order order) {
    // Step 1: Save to database
    orderRepository.save(order);
    
    // Step 2: Publish event to Kafka
    kafkaTemplate.send("orders", order);
}