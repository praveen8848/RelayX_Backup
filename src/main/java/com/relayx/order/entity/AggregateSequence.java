package com.relayx.order.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aggregate_sequences", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"aggregate_type", "aggregate_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AggregateSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false)
    private Long aggregateId;

    @Column(name = "last_sequence", nullable = false)
    private Integer lastSequence;
}