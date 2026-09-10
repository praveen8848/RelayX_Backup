package com.relayx.ingestion.controller;

import com.relayx.order.entity.AggregateSequence;
import com.relayx.order.repository.AggregateSequenceRepository;
import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventIngestionController {

    private final OutboxEventRepository outboxEventRepository;
    private final AggregateSequenceRepository aggregateSequenceRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> publishEvent(@RequestBody Map<String, Object> request,
                                                            Authentication authentication) {
        Long projectId = (Long) authentication.getPrincipal();

        String aggregateType = (String) request.get("aggregateType");
        Long aggregateId = Long.valueOf(request.get("aggregateId").toString());
        String eventType = (String) request.get("eventType");
        String topic = (String) request.get("topic");
        String payload = (String) request.get("payload");

        // Generate next sequence number for this aggregate
        int sequenceNumber = getNextSequenceNumber(aggregateType, aggregateId);

        OutboxEvent event = OutboxEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .topic(topic)
                .payload(payload)
                .status("PENDING")
                .projectId(projectId)
                .maxRetryCount(5)   // default; can be configured
                .sequenceNumber(sequenceNumber)
                .build();

        outboxEventRepository.save(event);
        return ResponseEntity.ok(Map.of("eventId", event.getEventId(), "status", "accepted"));
    }

    private int getNextSequenceNumber(String aggregateType, Long aggregateId) {
        Optional<AggregateSequence> existing = aggregateSequenceRepository
                .findByAggregateTypeAndAggregateIdForUpdate(aggregateType, aggregateId);

        AggregateSequence sequence;
        if (existing.isPresent()) {
            sequence = existing.get();
            sequence.setLastSequence(sequence.getLastSequence() + 1);
        } else {
            sequence = AggregateSequence.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .lastSequence(1)
                    .build();
        }

        aggregateSequenceRepository.save(sequence);
        return sequence.getLastSequence();
    }
}