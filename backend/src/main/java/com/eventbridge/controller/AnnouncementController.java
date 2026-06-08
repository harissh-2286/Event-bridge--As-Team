package com.eventbridge.controller;

import com.eventbridge.dto.AnnouncementRequest;
import com.eventbridge.model.Announcement;
import com.eventbridge.model.Event;
import com.eventbridge.model.User;
import com.eventbridge.service.AnnouncementService;
import com.eventbridge.service.EventService;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {
    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private UserService userService;

    @Autowired
    private EventService eventService;

    @GetMapping
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> createAnnouncement(@RequestBody AnnouncementRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> sender = userService.findByUsername(username);
        if (sender.isEmpty()) {
            return ResponseEntity.badRequest().body("Sender profile not found.");
        }

        Event event = null;
        if (request.getEventId() != null) {
            Optional<Event> eventOpt = eventService.getEventById(request.getEventId());
            if (eventOpt.isPresent()) {
                event = eventOpt.get();
            } else {
                return ResponseEntity.badRequest().body("Linked event not found.");
            }
        }

        Announcement announcement = Announcement.builder()
                .event(event)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        try {
            Announcement created = announcementService.createAnnouncement(announcement, sender.get());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<Announcement>> getAnnouncementsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(announcementService.getAnnouncementsByEvent(eventId));
    }

    @GetMapping("/user")
    public ResponseEntity<?> getAnnouncementsForCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> currentUser = userService.findByUsername(username);
        if (currentUser.isPresent()) {
            List<Announcement> list = announcementService.getAnnouncementsForUser(currentUser.get());
            return ResponseEntity.ok(list);
        }
        return ResponseEntity.badRequest().body("User not authenticated.");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok("Announcement deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
