package com.eventbridge.service;

import com.eventbridge.model.Notification;
import com.eventbridge.model.User;
import com.eventbridge.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Notification createNotification(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        // Send real-time notification update to specific user via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    saved
            );
        } catch (Exception e) {
            // WebSocket send failure does not block execution
        }

        return saved;
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(userId);
        for (Notification n : notifications) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
}
