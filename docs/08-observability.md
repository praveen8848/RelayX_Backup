# Observability in RelayX

## 1. Why Observability?

RelayX is a mission‑critical infrastructure component that must reliably deliver events from the database to Kafka. To operate it in production, we need deep visibility into:

- How many events are being processed
- Success and failure rates
- Retry activity
- Queue backlog (pending events)
- Delivery latency

Observability helps us detect issues early, troubleshoot failures, and understand system performance.

## 2. Metrics Strategy

RelayX exposes metrics using **Micrometer** and **Prometheus**. Micrometer is the default metrics library in Spring Boot, and it can integrate with many monitoring systems. We use the Prometheus registry for easy local development and integration with Grafana dashboards.

All metrics are prefixed with `relay_` to avoid collisions.

## 3. Custom Metrics

We define the following custom metrics in `RelayMetricsService`:

| Metric Name                 | Type      | Description                                                      |
|-----------------------------|-----------|------------------------------------------------------------------|
| `relay_events_total`        | Counter   | Total number of outbox events processed by the relay             |
| `relay_events_success`      | Counter   | Number of events successfully published to Kafka                |
| `relay_events_failed`       | Counter   | Number of publish attempts that failed                           |
| `relay_events_retry`        | Counter   | Number of retries scheduled after a failure                      |
| `event_delivery_latency`    | Timer     | Time taken to publish an event (in milliseconds)                 |
| `outbox_queue_size`         | Gauge     | Current number of events in `PENDING` status                     |

## 4. Implementation

### 4.1 Dependencies

Add the Prometheus registry to `pom.xml`:

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>