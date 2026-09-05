package com.relayx.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String customerId;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
    private boolean outboxEventCreated;
    private Long outboxEventId;
}