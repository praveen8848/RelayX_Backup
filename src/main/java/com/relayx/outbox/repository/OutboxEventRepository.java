package com.relayx.outbox.repository;

import com.relayx.outbox.entity.OutboxEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * Find all PENDING events that are due for processing (non-locking).
     */
    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'PENDING' " +
            "AND (e.nextRetryAt IS NULL OR e.nextRetryAt <= :now) " +
            "ORDER BY e.createdAt ASC")
    List<OutboxEvent> findDueEvents(@Param("now") LocalDateTime now);

    /**
     * Reset a DEAD event back to PENDING with retryCount = 0 and nextRetryAt = null.
     */
    @Modifying
    @Query("UPDATE OutboxEvent e SET e.status = 'PENDING', e.retryCount = 0, " +
            "e.nextRetryAt = null, e.lastError = null WHERE e.id = :id")
    void resetEventForRetry(@Param("id") Long id);

    /**
     * Select a batch of due events and lock them for processing,
     * respecting per-aggregate ordering using SKIP LOCKED.
     */
    @Query(value = "SELECT e1.* FROM outbox_events e1 " +
            "WHERE e1.status = 'PENDING' " +
            "AND (e1.next_retry_at IS NULL OR e1.next_retry_at <= :now) " +
            "AND NOT EXISTS (" +
            "    SELECT 1 FROM outbox_events e2 " +
            "    WHERE e2.aggregate_type = e1.aggregate_type " +
            "    AND e2.aggregate_id = e1.aggregate_id " +
            "    AND e2.sequence_number < e1.sequence_number " +
            "    AND e2.status <> 'PUBLISHED'" +
            ") " +
            "ORDER BY e1.created_at ASC " +
            "LIMIT :limit " +
            "FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<OutboxEvent> findDueEventsForUpdate(@Param("now") LocalDateTime now, @Param("limit") int limit);

    // ===== Dashboard metric queries =====

    @Query("SELECT COUNT(e) FROM OutboxEvent e WHERE e.createdAt >= :startOfDay")
    long countEventsSince(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(e) FROM OutboxEvent e WHERE e.status = 'PUBLISHED' AND e.createdAt >= :startOfDay")
    long countPublishedSince(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(e) FROM OutboxEvent e WHERE e.status = 'PENDING' AND e.retryCount > 0")
    long countRetrying();

    @Query("SELECT COUNT(e) FROM OutboxEvent e WHERE e.status = 'DEAD'")
    long countDead();

    // ===== Event Explorer search with pagination =====

    java.util.Optional<OutboxEvent> findByEventId(String eventId);
    @Query("SELECT e FROM OutboxEvent e WHERE " +
            "(:status IS NULL OR e.status = :status) AND " +
            "(:aggregateType IS NULL OR e.aggregateType = :aggregateType) AND " +
            "(:fromDate IS NULL OR e.createdAt >= :fromDate) AND " +
            "(:toDate IS NULL OR e.createdAt <= :toDate) " +
            "ORDER BY e.createdAt DESC")
    Page<OutboxEvent> searchEvents(@Param("status") String status,
                                   @Param("aggregateType") String aggregateType,
                                   @Param("fromDate") LocalDateTime fromDate,
                                   @Param("toDate") LocalDateTime toDate,
                                   Pageable pageable);
}