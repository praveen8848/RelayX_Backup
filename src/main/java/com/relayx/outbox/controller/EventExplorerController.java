package com.relayx.outbox.controller;

import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventExplorerController {

    private final OutboxEventRepository outboxEventRepository;

    @GetMapping
    public ResponseEntity<Page<OutboxEvent>> searchEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String aggregateType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OutboxEvent> events = outboxEventRepository.searchEvents(status, aggregateType, fromDate, toDate, pageable);
        return ResponseEntity.ok(events);
    }
}