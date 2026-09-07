package com.relayx.order.repository;

import com.relayx.order.entity.AggregateSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface AggregateSequenceRepository extends JpaRepository<AggregateSequence, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AggregateSequence a WHERE a.aggregateType = :type AND a.aggregateId = :id")
    Optional<AggregateSequence> findByAggregateTypeAndAggregateIdForUpdate(
            @Param("type") String type,
            @Param("id") Long id
    );
}