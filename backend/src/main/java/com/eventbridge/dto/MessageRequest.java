package com.eventbridge.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private Long receiverId;
    private String content;
}
