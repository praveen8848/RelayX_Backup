package com.relayx.relay.consumer;

import com.relayx.consumer.entity.ProcessedEvent;
import com.relayx.consumer.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    private final ProcessedEventRepository processedEventRepository;

    @KafkaListener(topics = "order-events", groupId = "relayx-order-consumer")
    @Transactional
    public void consume(String message, @Header(name = "eventId", required = false) String eventId) {
        // Idempotency check: if we've already processed this event, skip it.
        if (eventId != null && processedEventRepository.existsByEventId(eventId)) {
            log.info("Duplicate event ignored: {}", eventId);
            return;
        }

        log.info("Processing event: {}", message);

        // ===== Business logic goes here =====
        // e.g., update read model, send email, call other services

        // Mark event as processed to prevent duplicate processing.
        if (eventId != null) {
            ProcessedEvent processedEvent = ProcessedEvent.builder()
                    .eventId(eventId)
                    .build();
            processedEventRepository.save(processedEvent);
            log.info("Event marked as processed: {}", eventId);
        } else {
            log.warn("No eventId header found; cannot guarantee idempotency.");
        }
    }
}