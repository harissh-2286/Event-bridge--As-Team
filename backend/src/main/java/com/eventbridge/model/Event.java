package com.eventbridge.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_name", nullable = false, length = 100)
    private String eventName;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "event_time", nullable = false)
    private LocalTime eventTime;

    @Column(nullable = false, length = 100)
    private String venue;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "team_limit", nullable = false)
    private Integer teamLimit = 1;

    @Column(name = "entry_fee", nullable = false)
    private Double entryFee = 0.0;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "banner_url", length = 255)
    private String bannerUrl;

    @Column(name = "registration_deadline", nullable = false)
    private LocalDate registrationDeadline;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // "ACTIVE", "CANCELLED"

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
        if (teamLimit == null) {
            teamLimit = 1;
        }
        if (entryFee == null) {
            entryFee = 0.0;
        }
    }

    public Double getEntryFee() {
        return entryFee == null ? 0.0 : entryFee;
    }
}
