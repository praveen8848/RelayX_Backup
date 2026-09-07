package com.relayx.common.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RelayMetricsService {

    private final MeterRegistry meterRegistry;

    private final Counter eventsTotal;
    private final Counter eventsSuccess;
    private final Counter eventsFailed;
    private final Counter eventsRetry;
    private final Timer deliveryLatency;

    public RelayMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.eventsTotal = Counter.builder("relay_events_total")
                .description("Total number of outbox events processed")
                .register(meterRegistry);
        this.eventsSuccess = Counter.builder("relay_events_success")
                .description("Number of events successfully published")
                .register(meterRegistry);
        this.eventsFailed = Counter.builder("relay_events_failed")
                .description("Number of failed publish attempts")
                .register(meterRegistry);
        this.eventsRetry = Counter.builder("relay_events_retry")
                .description("Number of retries scheduled")
                .register(meterRegistry);
        this.deliveryLatency = Timer.builder("event_delivery_latency")
                .description("Time from event creation to successful publish")
                .register(meterRegistry);
    }

    public void incrementEventsTotal() {
        eventsTotal.increment();
    }

    public void incrementEventsSuccess() {
        eventsSuccess.increment();
    }

    public void incrementEventsFailed() {
        eventsFailed.increment();
    }

    public void incrementEventsRetry() {
        eventsRetry.increment();
    }

    public void recordDeliveryLatency(long durationMillis) {
        deliveryLatency.record(durationMillis, TimeUnit.MILLISECONDS);
    }

    /**
     * Update a gauge with the current number of PENDING events.
     */
    public void updatePendingQueueSize(long size) {
        meterRegistry.gauge("outbox_queue_size", size);
    }
}