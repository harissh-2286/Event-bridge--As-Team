package com.eventbridge.controller;

import com.eventbridge.dto.JwtResponse;
import com.eventbridge.dto.LoginRequest;
import com.eventbridge.dto.SignupRequest;
import com.eventbridge.model.User;
import com.eventbridge.model.Role;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signupRequest) {
        try {
            Role role;
            try {
                role = Role.valueOf(signupRequest.getRole().toUpperCase());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Invalid role. Select PARTICIPANT, ORGANIZER, FACULTY, or ADMIN.");
            }

            User user = User.builder()
                    .username(signupRequest.getUsername())
                    .email(signupRequest.getEmail())
                    .password(signupRequest.getPassword())
                    .role(role)
                    .fullName(signupRequest.getFullName())
                    .registerNumber(signupRequest.getRegisterNumber())
                    .department(signupRequest.getDepartment())
                    .build();

            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            String jwt = userService.authenticateUser(loginRequest.getUsername(), loginRequest.getPassword());
            Optional<User> userOpt = userService.findByUsername(loginRequest.getUsername());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return ResponseEntity.ok(new JwtResponse(
                        jwt,
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getFullName()
                ));
            }
            return ResponseEntity.badRequest().body("User authentication succeeded but user record not found.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid username or password: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username != null && !"anonymousUser".equals(username)) {
            userService.logoutUser(username);
            return ResponseEntity.ok("Logged out successfully");
        }
        return ResponseEntity.badRequest().body("No active session found.");
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userService.findByUsername(username);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.badRequest().body("User profile not found.");
    }

    @PutMapping("/profile/update")
    public ResponseEntity<?> updateUserProfile(@RequestBody User userDetails) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userService.findByUsername(username);
        if (userOpt.isPresent()) {
            User updated = userService.updateUserProfile(userOpt.get().getId(), userDetails);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.badRequest().body("User not found.");
    }
}
