package com.relayx.outbox.service;

import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxService {

    private final OutboxEventRepository outboxEventRepository;

    @Transactional(readOnly = true)
    public List<OutboxEvent> getPendingEvents() {
        return outboxEventRepository.findByStatusOrderByCreatedAtAsc("PENDING");
    }

    @Transactional(readOnly = true)
    public long getPendingEventCount() {
        return outboxEventRepository.countByStatus("PENDING");
    }

    @Transactional(readOnly = true)
    public List<OutboxEvent> getEventsByAggregate(String aggregateType, Long aggregateId) {
        return outboxEventRepository.findByAggregateTypeAndAggregateIdOrderByCreatedAtAsc(
                aggregateType, aggregateId);
    }

    @Transactional(readOnly = true)
    public OutboxEvent getEvent(Long eventId) {
        return outboxEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Outbox event not found: " + eventId));
    }
}