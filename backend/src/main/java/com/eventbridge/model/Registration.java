package com.eventbridge.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"participant_id", "event_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "registration_date", updatable = false)
    private LocalDateTime registrationDate = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // "PENDING", "APPROVED", "REJECTED"

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING"; // "PENDING", "PAID"

    @PrePersist
    protected void onCreate() {
        registrationDate = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (paymentStatus == null) {
            paymentStatus = "PENDING";
        }
    }
}
