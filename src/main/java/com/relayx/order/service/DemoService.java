package com.relayx.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.relayx.order.entity.AggregateSequence;
import com.relayx.order.entity.Order;
import com.relayx.order.repository.AggregateSequenceRepository;
import com.relayx.order.repository.OrderRepository;
import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemoService {

    private final OrderRepository orderRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final AggregateSequenceRepository aggregateSequenceRepository;
    private final ObjectMapper objectMapper;

    @Value("${relay.retry.max-attempts:5}")
    private int maxRetryAttempts;

    /**
     * Bulk-generate N outbox events quickly.
     * Each event gets a distinct aggregateId, so the relay can process them in parallel.
     */
    @Transactional
    public int generateBulkEvents(int count) {
        List<OutboxEvent> events = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            long aggregateId = System.nanoTime() + i;  // unique enough for demo
            OutboxEvent event = OutboxEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .aggregateType("BulkOrder")
                    .aggregateId(aggregateId)
                    .eventType("BulkOrderCreated")
                    .topic("order-events")
                    .payload("{\"bulkIndex\":" + i + "}")
                    .status("PENDING")
                    .maxRetryCount(maxRetryAttempts)
                    .sequenceNumber(1)
                    .build();
            events.add(event);
        }
        outboxEventRepository.saveAll(events);
        log.info("Generated {} bulk events", count);
        return count;
    }

    /**
     * Create one order followed by three ordered events for the same aggregate:
     * OrderCreated (seq 1), OrderPaid (seq 2), OrderShipped (seq 3).
     * The relay should publish them strictly in this order.
     */
    @Transactional
    public Long createOrderingDemo(String customerId) {
        Order order = Order.builder()
                .customerId(customerId)
                .amount(new BigDecimal("500.00"))
                .status("CREATED")
                .build();
        order = orderRepository.save(order);

        Long aggregateId = order.getId();
        createEventForAggregate("Order", aggregateId, "OrderCreated",
                "{\"orderId\":" + aggregateId + ",\"stage\":\"created\"}");
        createEventForAggregate("Order", aggregateId, "OrderPaid",
                "{\"orderId\":" + aggregateId + ",\"stage\":\"paid\"}");
        createEventForAggregate("Order", aggregateId, "OrderShipped",
                "{\"orderId\":" + aggregateId + ",\"stage\":\"shipped\"}");

        log.info("Ordering demo created for aggregate {}", aggregateId);
        return aggregateId;
    }

    private void createEventForAggregate(String aggregateType, Long aggregateId,
                                         String eventType, String payload) {
        int sequence = getNextSequenceNumber(aggregateType, aggregateId);
        OutboxEvent event = OutboxEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .topic("order-events")
                .payload(payload)
                .status("PENDING")
                .maxRetryCount(maxRetryAttempts)
                .sequenceNumber(sequence)
                .build();
        outboxEventRepository.save(event);
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