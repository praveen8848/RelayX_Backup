package com.relayx.relay.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Publish an event to Kafka without an eventId header.
     * Use this only if idempotency is not required.
     */
    public void publish(String topic, String key, String payload) {
        publish(topic, key, payload, null);
    }

    /**
     * Publish an event to Kafka, optionally attaching the eventId as a header.
     * The eventId is used by consumers to deduplicate messages.
     */
    public void publish(String topic, String key, String payload, String eventId) {
        log.debug("Publishing event to topic: {}, key: {}, eventId: {}", topic, key, eventId);

        ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, payload);
        if (eventId != null) {
            record.headers().add(new RecordHeader("eventId", eventId.getBytes(StandardCharsets.UTF_8)));
        }

        try {
            kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
            log.info("Event published to topic: {}", topic);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Failed to publish event to topic: {}, error: {}", topic, e.getMessage());
            throw new RuntimeException("Kafka publish failed", e);
        }
    }
}