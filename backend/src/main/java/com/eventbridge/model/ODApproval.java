package com.eventbridge.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "od_approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ODApproval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id")
    private User faculty;

    @Column(name = "approval_status", nullable = false, length = 20)
    private String approvalStatus = "PENDING"; // "PENDING", "APPROVED", "REJECTED"

    @Column(name = "date_requested", nullable = false, updatable = false)
    private LocalDateTime dateRequested = LocalDateTime.now();

    @Column(name = "date_approved")
    private LocalDateTime dateApproved;

    @Column(name = "pdf_path", length = 255)
    private String pdfPath;

    @PrePersist
    protected void onCreate() {
        dateRequested = LocalDateTime.now();
        if (approvalStatus == null) {
            approvalStatus = "PENDING";
        }
    }
}
