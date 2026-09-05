package com.relayx.relay.consumer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class KafkaEventConsumer {

    @KafkaListener(topics = "order-events", groupId = "relayx-order-consumer")
    public void consume(String message) {
        log.info("✅ Received event from Kafka: {}", message);
        // Process the event here (e.g., update read model, call other services, etc.)
    }
}