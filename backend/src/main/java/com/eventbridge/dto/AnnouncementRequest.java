package com.eventbridge.dto;

import lombok.Data;

@Data
public class AnnouncementRequest {
    private Long eventId; // optional, null for general college announcements
    private String title;
    private String content;
}
