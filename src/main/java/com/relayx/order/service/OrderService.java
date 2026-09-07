package com.relayx.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.relayx.order.dto.OrderRequest;
import com.relayx.order.dto.OrderResponse;
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

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final AggregateSequenceRepository aggregateSequenceRepository;

    @Value("${relay.retry.max-attempts:5}")
    private int maxRetryAttempts;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerId());

        // 1. Save Order
        Order order = Order.builder()
                .customerId(request.getCustomerId())
                .amount(request.getAmount())
                .status("CREATED")
                .build();

        order = orderRepository.save(order);
        log.info("Order saved with ID: {}", order.getId());

        // 2. Get next sequence number for this aggregate (Order, order.getId())
        int sequenceNumber = getNextSequenceNumber("Order", order.getId());

        // 3. Create and save Outbox Event with sequence number in the SAME transaction
        OutboxEvent outboxEvent = createOutboxEvent(order, sequenceNumber);
        outboxEvent = outboxEventRepository.save(outboxEvent);
        log.info("Outbox event created with ID: {}, sequence: {}", outboxEvent.getId(), sequenceNumber);

        // 4. Return response
        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .amount(order.getAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .outboxEventCreated(true)
                .outboxEventId(outboxEvent.getId())
                .build();
    }

    /**
     * Atomically fetch and increment the sequence number for a given aggregate.
     * Uses pessimistic locking to ensure no two events get the same sequence.
     */
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

    private OutboxEvent createOutboxEvent(Order order, int sequenceNumber) {
        try {
            String payload = objectMapper.writeValueAsString(order);

            return OutboxEvent.builder()
                    .eventId(java.util.UUID.randomUUID().toString())
                    .aggregateType("Order")
                    .aggregateId(order.getId())
                    .eventType("OrderCreated")
                    .payload(payload)
                    .status("PENDING")
                    .topic("order-events")
                    .maxRetryCount(maxRetryAttempts)
                    .sequenceNumber(sequenceNumber)   // set sequence number
                    .build();
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize order to JSON", e);
            throw new RuntimeException("Failed to create outbox event", e);
        }
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .amount(order.getAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Transactional
    public void createOrderWithRollback(OrderRequest request) {
        // 1. Save order
        Order order = Order.builder()
                .customerId(request.getCustomerId())
                .amount(request.getAmount())
                .status("CREATED")
                .build();
        order = orderRepository.save(order);
        log.info("Order saved, but now simulating failure before outbox event...");

        // 2. Simulate an unexpected error before outbox event is saved
        throw new RuntimeException("Simulated failure: transaction should rollback");
    }
}