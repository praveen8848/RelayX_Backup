package com.relayx.outbox.controller;

import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.service.OutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outbox")
@RequiredArgsConstructor
public class OutboxController {

    private final OutboxService outboxService;

    @GetMapping("/pending")
    public List<OutboxEvent> getPendingEvents() {
        return outboxService.getPendingEvents();
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        long pending = outboxService.getPendingEventCount();
        // For simplicity, we only count pending; you can extend
        return Map.of("pending", pending);
    }
}