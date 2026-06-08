package com.eventbridge.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(name = "message_content", nullable = false, columnDefinition = "TEXT")
    private String messageContent;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
    }
}
