package com.relayx.outbox.controller;

import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final OutboxEventRepository outboxEventRepository;

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        long totalToday = outboxEventRepository.countEventsSince(startOfDay);
        long publishedToday = outboxEventRepository.countPublishedSince(startOfDay);
        long retrying = outboxEventRepository.countRetrying();
        long dead = outboxEventRepository.countDead();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalToday", totalToday);
        metrics.put("publishedToday", publishedToday);
        metrics.put("retrying", retrying);
        metrics.put("dead", dead);
        return ResponseEntity.ok(metrics);
    }
}