package com.relayx.common.simulation;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class SimulationState {

    private final AtomicBoolean kafkaDown = new AtomicBoolean(false);

    public void setKafkaDown(boolean down) {
        kafkaDown.set(down);
    }

    public boolean isKafkaDown() {
        return kafkaDown.get();
    }
}