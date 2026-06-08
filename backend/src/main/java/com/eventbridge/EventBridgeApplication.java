package com.eventbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class EventBridgeApplication {
    public static void main(String[] args) {
        SpringApplication.run(EventBridgeApplication.class, args);
    }
}
