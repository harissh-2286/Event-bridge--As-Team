package com.eventbridge.service;

import com.eventbridge.model.User;
import com.eventbridge.model.Role;
import com.eventbridge.repository.UserRepository;
import com.eventbridge.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setOnlineStatus(false);
        return userRepository.save(user);
    }

    public String authenticateUser(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        // Update user status to online
        Optional<User> user = userRepository.findByUsername(username);
        user.ifPresent(u -> {
            u.setOnlineStatus(true);
            userRepository.save(u);
        });

        return jwt;
    }

    public void logoutUser(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        user.ifPresent(u -> {
            u.setOnlineStatus(false);
            userRepository.save(u);
        });
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public User updateUserProfile(Long userId, User userDetails) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        if (userDetails.getRegisterNumber() != null) {
            user.setRegisterNumber(userDetails.getRegisterNumber());
        }
        if (userDetails.getDepartment() != null) {
            user.setDepartment(userDetails.getDepartment());
        }
        return userRepository.save(user);
    }
}
