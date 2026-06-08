package com.eventbridge.controller;

import com.eventbridge.model.User;
import com.eventbridge.service.UserService;
import com.eventbridge.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @Autowired
    private UserService userService;

    @Autowired
    private EventService eventService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("User deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting user: " + e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = eventService.getDashboardStats();
        // Add user stats
        List<User> users = userService.getAllUsers();
        long participants = users.stream().filter(u -> com.eventbridge.model.Role.PARTICIPANT == u.getRole()).count();
        long organizers = users.stream().filter(u -> com.eventbridge.model.Role.ORGANIZER == u.getRole()).count();
        long faculty = users.stream().filter(u -> com.eventbridge.model.Role.FACULTY == u.getRole()).count();
        long online = users.stream().filter(User::getOnlineStatus).count();
        
        stats.put("totalUsers", users.size());
        stats.put("participantsCount", participants);
        stats.put("organizersCount", organizers);
        stats.put("facultyCount", faculty);
        stats.put("onlineCount", online);
        
        return ResponseEntity.ok(stats);
    }
}
