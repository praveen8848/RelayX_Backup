package com.relayx.relay.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.TimeoutException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publish(String topic, String key, String payload) {
        log.debug("Publishing event to topic: {}, key: {}", topic, key);
        try {
            kafkaTemplate.send(topic, key, payload).get(10, TimeUnit.SECONDS);
            log.info("Event published to topic: {}", topic);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Failed to publish event to topic: {}, error: {}", topic, e.getMessage());
            throw new RuntimeException("Kafka publish failed", e);
        }
    }
}