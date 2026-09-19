package com.relayx.order.controller;

import com.relayx.order.service.DemoService;
import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/simulate")
@RequiredArgsConstructor
@Slf4j
public class DemoController {

    private final DemoService demoService;
    private final OutboxEventRepository outboxEventRepository;

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> generateBulk(
            @RequestParam(defaultValue = "100") int count) {
        log.info("Bulk generation requested: count={}", count);
        int created = demoService.generateBulkEvents(count);
        return ResponseEntity.ok(Map.of(
                "created", created,
                "message", "Bulk events queued. Watch the relay drain them."
        ));
    }

    @PostMapping("/ordering-demo")
    public ResponseEntity<Map<String, Object>> orderingDemo(
            @RequestParam(defaultValue = "ordering-demo-customer") String customerId) {
        Long aggregateId = demoService.createOrderingDemo(customerId);
        return ResponseEntity.ok(Map.of(
                "aggregateId", aggregateId,
                "message", "Three ordered events created. Relay will publish them in order."
        ));
    }

    @PostMapping("/duplicate/{eventId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> triggerDuplicate(@PathVariable String eventId) {
        OutboxEvent event = outboxEventRepository.findByEventId(eventId)
                .orElseThrow(() -> new RuntimeException("No event with id " + eventId));

        event.setStatus("PENDING");
        event.setNextRetryAt(null);
        event.setRetryCount(0);
        outboxEventRepository.save(event);

        return ResponseEntity.ok(Map.of(
                "eventId", eventId,
                "message", "Event reset to PENDING. Consumer should ignore the duplicate."
        ));
    }
}