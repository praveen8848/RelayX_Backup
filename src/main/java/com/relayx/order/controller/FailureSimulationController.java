package com.relayx.order.controller;

import com.relayx.common.simulation.SimulationState;
import com.relayx.order.dto.OrderRequest;
import com.relayx.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/simulate")
@RequiredArgsConstructor
@Slf4j
public class FailureSimulationController {

    private final OrderService orderService;
    private final SimulationState simulationState;

    /**
     * Turn the simulated Kafka outage ON.
     * The relay will refuse to publish until /kafka-up is called.
     */
    @PostMapping("/kafka-down")
    public ResponseEntity<Map<String, Object>> simulateKafkaDown() {
        simulationState.setKafkaDown(true);
        log.warn("Simulated Kafka outage ENABLED. Relay will fail all publishes until /kafka-up.");
        return ResponseEntity.ok(Map.of(
                "kafkaDown", true,
                "message", "Kafka simulated as DOWN. Events will stay PENDING."
        ));
    }

    /**
     * Turn the simulated Kafka outage OFF.
     * On the next relay poll, PENDING events will publish normally.
     */
    @PostMapping("/kafka-up")
    public ResponseEntity<Map<String, Object>> simulateKafkaUp() {
        simulationState.setKafkaDown(false);
        log.info("Simulated Kafka outage DISABLED. Relay will resume publishing.");
        return ResponseEntity.ok(Map.of(
                "kafkaDown", false,
                "message", "Kafka simulated as UP. Pending events will publish on the next poll."
        ));
    }

    /**
     * Read the current simulation state (used by the frontend badge).
     */
    @GetMapping("/kafka-status")
    public ResponseEntity<Map<String, Object>> kafkaStatus() {
        return ResponseEntity.ok(Map.of("kafkaDown", simulationState.isKafkaDown()));
    }

    /**
     * Simulates a database rollback: order is saved but an exception is thrown
     * before the outbox event is persisted. Both should be rolled back.
     */
    @PostMapping("/db-rollback")
    public ResponseEntity<Map<String, Object>> simulateDbRollback() {
        log.warn("Simulating DB rollback during order creation...");
        OrderRequest request = OrderRequest.builder()
                .customerId("rollback-test-" + System.currentTimeMillis())
                .amount(new BigDecimal("10.00"))
                .build();
        try {
            orderService.createOrderWithRollback(request);
            return ResponseEntity.ok(Map.of(
                    "result", "unexpected success",
                    "message", "Transaction did NOT roll back — check @Transactional on the service."
            ));
        } catch (RuntimeException e) {
            log.info("Rollback occurred as expected: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                    "result", "rolled back",
                    "message", "Order and outbox event were NOT saved."
            ));
        }
    }
}