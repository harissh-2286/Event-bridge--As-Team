package com.eventbridge.controller;

import com.eventbridge.model.ODApproval;
import com.eventbridge.model.User;
import com.eventbridge.service.ODService;
import com.eventbridge.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/od")
public class ODController {
    @Autowired
    private ODService odService;

    @Autowired
    private UserService userService;

    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<ODApproval>> getODRequestsForFaculty() {
        // Faculty members can see all OD requests waiting for their approval or general ones
        return ResponseEntity.ok(odService.getAllODRequests());
    }

    @GetMapping("/student")
    public ResponseEntity<?> getODRequestsForStudent() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> student = userService.findByUsername(username);
        if (student.isPresent()) {
            return ResponseEntity.ok(odService.getODRequestsByStudent(student.get().getId()));
        }
        return ResponseEntity.badRequest().body("Student profile not found.");
    }

    @PutMapping("/status/{odId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> updateODStatus(@PathVariable Long odId, @RequestParam String status) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> faculty = userService.findByUsername(username);
        if (faculty.isPresent()) {
            try {
                ODApproval updated = odService.updateODStatus(odId, status, faculty.get());
                return ResponseEntity.ok(updated);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("Faculty advisor profile not found.");
    }

    @GetMapping("/download/{odId}")
    public ResponseEntity<?> downloadODLetter(@PathVariable Long odId) {
        try {
            byte[] pdfBytes = odService.getODLetterPdf(odId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = "OD_Letter_Ref_" + odId + ".pdf";
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot download OD letter: " + e.getMessage());
        }
    }
}
