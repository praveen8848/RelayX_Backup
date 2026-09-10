package com.relayx.relay.service;

import com.relayx.common.metrics.RelayMetricsService;
import com.relayx.outbox.entity.OutboxEvent;
import com.relayx.outbox.repository.OutboxEventRepository;
import com.relayx.relay.producer.KafkaEventProducer;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RelayService {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaEventProducer kafkaEventProducer;
    private final RelayMetricsService metricsService;


    @Value("${relay.retry.base-delay-ms:1000}")
    private long baseDelayMs;

    @Value("${relay.retry.max-delay-ms:60000}")
    private long maxDelayMs;

    @Getter
    @Value("${relay.batch-size:10}")
    private int batchSize;

    @Getter
    @Value("${relay.poll-interval-ms:5000}")
    private long pollIntervalMs;

    @Getter
    private volatile LocalDateTime lastPollAt;

    @Scheduled(fixedDelayString = "${relay.poll-interval-ms:5000}")
    @Transactional
    public void relayPendingEvents() {
        this.lastPollAt = LocalDateTime.now();
        LocalDateTime now = LocalDateTime.now();
        List<OutboxEvent> dueEvents = outboxEventRepository.findDueEventsForUpdate(now, batchSize);

        if (dueEvents.isEmpty()) {
            log.debug("No due events found.");
            return;
        }

        log.info("Worker {} processing {} events.", Thread.currentThread().getName(), dueEvents.size());

        for (OutboxEvent event : dueEvents) {
            metricsService.incrementEventsTotal();
            try {
                long start = System.currentTimeMillis();
                publishEvent(event);
                markEventPublished(event);
                long duration = System.currentTimeMillis() - start;
                metricsService.incrementEventsSuccess();
                metricsService.recordDeliveryLatency(duration);
            } catch (Exception e) {
                log.error("Failed to publish event id: {}, error: {}", event.getId(), e.getMessage());
                metricsService.incrementEventsFailed();
                handlePublishFailure(event, e);
            }
        }
    }

    private void publishEvent(OutboxEvent event) {
        String key = event.getAggregateType() + "-" + event.getAggregateId();
        kafkaEventProducer.publish(event.getTopic(), key, event.getPayload(), event.getEventId());
    }

    private void markEventPublished(OutboxEvent event) {
        event.setStatus("PUBLISHED");
        event.setPublishedAt(LocalDateTime.now());
        event.setNextRetryAt(null);
        event.setLastError(null);
        outboxEventRepository.save(event);
        log.info("Event id: {} marked as PUBLISHED", event.getId());
    }

    private void handlePublishFailure(OutboxEvent event, Exception e) {
        int newRetryCount = event.getRetryCount() + 1;
        event.setRetryCount(newRetryCount);
        event.setLastError(e.getMessage());
        if (newRetryCount >= event.getMaxRetryCount()) {
            // Move to Dead Letter Queue
            event.setStatus("DEAD");
            event.setNextRetryAt(null);
            log.warn("Event id: {} exceeded max retries. Moving to DEAD.", event.getId());
        } else {
            // Calculate next retry time with exponential backoff
            long delay = calculateBackoffDelay(newRetryCount);
            event.setNextRetryAt(LocalDateTime.now().plusNanos(delay * 1_000_000));
            log.info("Event id: {} retry scheduled in {} ms. Attempt {}/{}",
                    event.getId(), delay, newRetryCount, event.getMaxRetryCount());
        }
        outboxEventRepository.save(event);
    }

    private long calculateBackoffDelay(int retryCount) {
        long delay = baseDelayMs * (1L << (retryCount - 1)); // exponential: base * 2^(retry-1)
        // Add jitter to avoid thundering herd
        double jitter = 0.5 + Math.random() * 0.5; // 50%-100% of calculated delay
        delay = (long) (delay * jitter);
        return Math.min(delay, maxDelayMs);
    }
    @Scheduled(fixedDelay = 10000) // update queue size every 10 seconds
    public void updateQueueSizeGauge() {
        long pending = outboxEventRepository.countByStatus("PENDING");
        metricsService.updatePendingQueueSize(pending);
    }
}