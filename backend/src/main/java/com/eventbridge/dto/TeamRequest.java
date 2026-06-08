package com.eventbridge.dto;

import lombok.Data;
import java.util.List;

@Data
public class TeamRequest {
    private String teamName;
    private List<String> memberUsernames;
}
