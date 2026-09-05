package com.relayx.order.controller;

import com.relayx.order.dto.OrderRequest;
import com.relayx.order.service.OrderService;
import com.relayx.relay.producer.KafkaEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/simulate")
@RequiredArgsConstructor
@Slf4j
public class FailureSimulationController {

    private final OrderService orderService;
    private final KafkaEventProducer kafkaEventProducer;

    /**
     * Simulates a scenario where Kafka is down.
     * We attempt to publish a dummy event; if Kafka is unreachable, it throws.
     * In a real failure, the relay will later retry the outbox event.
     */
    @PostMapping("/kafka-down")
    public ResponseEntity<Map<String, String>> simulateKafkaDown() {
        log.warn("Simulating Kafka down: attempting to publish to a non-existent broker...");
        try {
            // Use a wrong port to force failure (or stop Kafka and keep same port)
            kafkaEventProducer.publish("order-events", "simulation", "{\"test\":true}");
            return ResponseEntity.ok(Map.of("result", "published (Kafka seems up)"));
        } catch (Exception e) {
            log.error("Kafka publish failed as expected: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "result", "failed",
                    "message", "Kafka publish failed. Outbox event would remain PENDING for retry."
            ));
        }
    }

    /**
     * Simulates a database rollback: order is saved but an exception is thrown
     * before the outbox event is persisted. Both should be rolled back.
     */
    @PostMapping("/db-rollback")
    public ResponseEntity<Map<String, String>> simulateDbRollback() {
        log.warn("Simulating DB rollback during order creation...");
        OrderRequest request = OrderRequest.builder()
                .customerId("rollback-test")
                .amount(new java.math.BigDecimal("10.00"))
                .build();
        try {
            orderService.createOrderWithRollback(request);
            return ResponseEntity.ok(Map.of("result", "unexpected success"));
        } catch (Exception e) {
            log.error("Rollback occurred as expected: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "result", "rolled back",
                    "message", "Order and outbox event were NOT saved."
            ));
        }
    }
}