package com.eventbridge.controller;

import com.eventbridge.model.Event;
import com.eventbridge.model.User;
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
@RequestMapping("/api/events")
public class EventController {
    @Autowired
    private EventService eventService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Event>> getUpcomingEvents() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventService.getEventById(id);
        if (event.isPresent()) {
            return ResponseEntity.ok(event.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> organizer = userService.findByUsername(username);
        if (organizer.isPresent()) {
            Event created = eventService.createEvent(event, organizer.get());
            return ResponseEntity.ok(created);
        }
        return ResponseEntity.badRequest().body("Organizer account not found.");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        try {
            Event updated = eventService.updateEvent(id, eventDetails);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('ADMIN')")
    public ResponseEntity<?> cancelEvent(@PathVariable Long id) {
        try {
            Event cancelled = eventService.cancelEvent(id);
            return ResponseEntity.ok(cancelled);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.ok("Event deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<List<Event>> getEventsByOrganizer(@PathVariable Long organizerId) {
        return ResponseEntity.ok(eventService.getEventsByOrganizer(organizerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Event>> searchEvents(@RequestParam String query) {
        return ResponseEntity.ok(eventService.searchEvents(query));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(eventService.getDashboardStats());
    }
}
