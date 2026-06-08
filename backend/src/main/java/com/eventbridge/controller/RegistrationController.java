package com.eventbridge.controller;

import com.eventbridge.dto.TeamRequest;
import com.eventbridge.model.Registration;
import com.eventbridge.model.Team;
import com.eventbridge.model.User;
import com.eventbridge.service.RegistrationService;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private UserService userService;

    @PostMapping("/individual/{eventId}")
    public ResponseEntity<?> registerIndividual(@PathVariable Long eventId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> participant = userService.findByUsername(username);
        if (participant.isPresent()) {
            try {
                Registration reg = registrationService.registerIndividual(eventId, participant.get());
                return ResponseEntity.ok(reg);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("User profile not found");
    }

    @PostMapping("/team/{eventId}")
    public ResponseEntity<?> registerTeam(@PathVariable Long eventId, @RequestBody TeamRequest teamRequest) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> leader = userService.findByUsername(username);
        if (leader.isPresent()) {
            try {
                Team team = registrationService.registerTeam(
                        eventId, 
                        teamRequest.getTeamName(), 
                        leader.get(), 
                        teamRequest.getMemberUsernames()
                );
                return ResponseEntity.ok(team);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("Leader profile not found");
    }

    @PutMapping("/status/{regId}")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateRegistrationStatus(@PathVariable Long regId, @RequestParam String status) {
        try {
            Registration updated = registrationService.updateRegistrationStatus(regId, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Registration>> getUserRegistrations(@PathVariable Long userId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByParticipant(userId));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<Registration>> getEventRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByEvent(eventId));
    }

    @PutMapping("/payment/{regId}")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long regId, @RequestParam String paymentStatus) {
        try {
            Registration updated = registrationService.updatePaymentStatus(regId, paymentStatus);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/cancel/{regId}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long regId) {
        try {
            registrationService.cancelRegistration(regId);
            return ResponseEntity.ok("Registration cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
