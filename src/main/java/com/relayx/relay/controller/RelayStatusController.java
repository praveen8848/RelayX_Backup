
package com.relayx.relay.controller;

import com.relayx.outbox.repository.OutboxEventRepository;
import com.relayx.relay.service.RelayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/relay")
@RequiredArgsConstructor
public class RelayStatusController {

    private final RelayService relayService;
    private final OutboxEventRepository outboxEventRepository;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        long pending = outboxEventRepository.countByStatus("PENDING");
        long dead = outboxEventRepository.countByStatus("DEAD");
        LocalDateTime lastPoll = relayService.getLastPollAt();

        Map<String, Object> status = new HashMap<>();
        status.put("pendingCount", pending);
        status.put("deadCount", dead);
        status.put("batchSize", relayService.getBatchSize());
        status.put("pollIntervalMs", relayService.getPollIntervalMs());
        status.put("lastPollAt", lastPoll);
        status.put("secondsSinceLastPoll",
                lastPoll == null ? null :
                        java.time.Duration.between(lastPoll, LocalDateTime.now()).getSeconds());
        return ResponseEntity.ok(status);
    }
}