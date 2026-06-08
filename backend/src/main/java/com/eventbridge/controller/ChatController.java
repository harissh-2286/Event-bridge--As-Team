package com.eventbridge.controller;

import com.eventbridge.dto.MessageRequest;
import com.eventbridge.model.Message;
import com.eventbridge.model.User;
import com.eventbridge.model.Role;
import com.eventbridge.service.ChatService;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @GetMapping("/history/{partnerId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Long partnerId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            List<Message> history = chatService.getChatHistory(currentUser.get().getId(), partnerId);
            return ResponseEntity.ok(history);
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }

    @GetMapping("/partners")
    public ResponseEntity<?> getChatPartners() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            List<User> partners = chatService.getChatPartners(currentUser.get().getId());
            return ResponseEntity.ok(partners);
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest messageRequest) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            try {
                Message sent = chatService.sendMessage(
                        currentUser.get().getId(), 
                        messageRequest.getReceiverId(), 
                        messageRequest.getContent()
                );
                return ResponseEntity.ok(sent);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getChattableUsers() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not authenticated.");
        }

        User user = currentUser.get();
        Role role = user.getRole();
        List<User> allUsers = userService.getAllUsers();
        List<User> filtered = new ArrayList<>();

        for (User u : allUsers) {
            if (u.getId().equals(user.getId())) continue;
            
            // Apply role-based filtering:
            // Organizer <-> Faculty, Participant <-> Organizer, Participant <-> Faculty
            if (role == Role.ORGANIZER) {
                if (u.getRole() == Role.FACULTY || u.getRole() == Role.PARTICIPANT || u.getRole() == Role.ADMIN) {
                    filtered.add(u);
                }
            } else if (role == Role.PARTICIPANT) {
                if (u.getRole() == Role.ORGANIZER || u.getRole() == Role.FACULTY) {
                    filtered.add(u);
                }
            } else if (role == Role.FACULTY) {
                if (u.getRole() == Role.ORGANIZER || u.getRole() == Role.PARTICIPANT || u.getRole() == Role.ADMIN) {
                    filtered.add(u);
                }
            } else if (role == Role.ADMIN) {
                filtered.add(u);
            }
        }

        return ResponseEntity.ok(filtered);
    }
}
