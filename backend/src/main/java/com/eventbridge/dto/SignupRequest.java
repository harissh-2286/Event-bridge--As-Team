package com.eventbridge.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String username;
    private String email;
    private String password;
    private String role; // 'PARTICIPANT', 'ORGANIZER', 'FACULTY', 'ADMIN'
    private String fullName;
    private String registerNumber;
    private String department;
}
