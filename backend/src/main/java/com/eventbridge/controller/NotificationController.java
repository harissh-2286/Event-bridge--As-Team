package com.eventbridge.controller;

import com.eventbridge.model.Notification;
import com.eventbridge.model.User;
import com.eventbridge.service.NotificationService;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getUserNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            List<Notification> list = notificationService.getUserNotifications(currentUser.get().getId());
            return ResponseEntity.ok(list);
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }

    @PutMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification read = notificationService.markAsRead(id);
            return ResponseEntity.ok(read);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            notificationService.markAllAsRead(currentUser.get().getId());
            return ResponseEntity.ok("All notifications marked as read");
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }
}
