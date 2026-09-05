package com.relayx.relay.controller;

import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dlq")
@RequiredArgsConstructor
public class DeadLetterController {

    private final OutboxEventRepository outboxEventRepository;

    @GetMapping
    public List<OutboxEvent> getDeadEvents() {
        return outboxEventRepository.findByStatusOrderByCreatedAtAsc("DEAD");
    }

    @PostMapping("/{id}/retry")
    @Transactional
    public ResponseEntity<Map<String, String>> retryEvent(@PathVariable Long id) {
        outboxEventRepository.resetEventForRetry(id);
        return ResponseEntity.ok(Map.of("result", "Event reset for retry"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> discardEvent(@PathVariable Long id) {
        outboxEventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("result", "Event discarded"));
    }
}