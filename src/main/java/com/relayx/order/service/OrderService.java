package com.relayx.order.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.relayx.order.dto.OrderRequest;
import com.relayx.order.dto.OrderResponse;
import com.relayx.order.entity.Order;
import com.relayx.order.repository.OrderRepository;
import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

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

        // 2. Create and save Outbox Event in the SAME transaction
        OutboxEvent outboxEvent = createOutboxEvent(order);
        outboxEvent = outboxEventRepository.save(outboxEvent);
        log.info("Outbox event created with ID: {}", outboxEvent.getId());

        // 3. Return response
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

    private OutboxEvent createOutboxEvent(Order order) {
        try {
            String payload = objectMapper.writeValueAsString(order);

            return OutboxEvent.builder()
                    .aggregateType("Order")
                    .aggregateId(order.getId())
                    .eventType("OrderCreated")
                    .payload(payload)
                    .status("PENDING")
                    .topic("order-events")
                    .maxRetryCount(maxRetryAttempts)   // default, could be from config
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