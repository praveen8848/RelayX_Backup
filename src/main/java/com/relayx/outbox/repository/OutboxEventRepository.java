package com.relayx.outbox.repository;

import com.relayx.outbox.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(String status);

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = :status AND e.createdAt >= :since ORDER BY e.createdAt ASC")
    List<OutboxEvent> findPendingEventsSince(
            @Param("status") String status,
            @Param("since") LocalDateTime since
    );

    long countByStatus(String status);

    List<OutboxEvent> findByAggregateTypeAndAggregateIdOrderByCreatedAtAsc(
            String aggregateType,
            Long aggregateId
    );

    /**
     * Find all PENDING events that are due for processing.
     * An event is due if nextRetryAt is null (never attempted) or <= now.
     */
    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'PENDING' " +
            "AND (e.nextRetryAt IS NULL OR e.nextRetryAt <= :now) " +
            "ORDER BY e.createdAt ASC")
    List<OutboxEvent> findDueEvents(@Param("now") LocalDateTime now);

    /**
     * Reset a DEAD event back to PENDING with retryCount = 0 and nextRetryAt = null.
     * This is used when manually retrying from the Dead Letter Queue.
     */
    @Modifying
    @Query("UPDATE OutboxEvent e SET e.status = 'PENDING', e.retryCount = 0, " +
            "e.nextRetryAt = null, e.lastError = null WHERE e.id = :id")
    void resetEventForRetry(@Param("id") Long id);
}