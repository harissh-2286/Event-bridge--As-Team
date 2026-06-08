package com.eventbridge.service;

import com.eventbridge.model.Announcement;
import com.eventbridge.model.Event;
import com.eventbridge.model.Registration;
import com.eventbridge.model.User;
import com.eventbridge.repository.AnnouncementRepository;
import com.eventbridge.repository.RegistrationRepository;
import com.eventbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnnouncementService {
    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Announcement createAnnouncement(Announcement announcement, User sender) {
        announcement.setSender(sender);
        announcement.setTimestamp(LocalDateTime.now());
        Announcement saved = announcementRepository.save(announcement);

        // Notify users
        if (announcement.getEvent() != null) {
            // Event specific announcement: notify all participants registered for this event
            Event event = announcement.getEvent();
            List<Registration> registrations = registrationRepository.findByEventId(event.getId());
            for (Registration reg : registrations) {
                User participant = reg.getParticipant();
                notificationService.createNotification(
                        participant, 
                        "New announcement in '" + event.getEventName() + "': " + announcement.getTitle()
                );
                emailService.sendNewAnnouncementEmail(
                        participant.getEmail(), 
                        "[" + event.getEventName() + "] " + announcement.getTitle(), 
                        announcement.getContent()
                );
            }
        } else {
            // General announcement: notify all participants and users
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (u.getId().equals(sender.getId())) continue;
                notificationService.createNotification(
                        u, 
                        "New general announcement: " + announcement.getTitle()
                );
                // Standard email notification for announcements
                emailService.sendNewAnnouncementEmail(
                        u.getEmail(), 
                        announcement.getTitle(), 
                        announcement.getContent()
                );
            }
        }

        return saved;
    }

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByTimestampDesc();
    }

    public List<Announcement> getAnnouncementsByEvent(Long eventId) {
        return announcementRepository.findByEventIdOrderByTimestampDesc(eventId);
    }

    public List<Announcement> getAnnouncementsForUser(User user) {
        if (user.getRole() == com.eventbridge.model.Role.PARTICIPANT) {
            // Get event IDs user is registered to
            List<Registration> registrations = registrationRepository.findByParticipantId(user.getId());
            List<Long> eventIds = registrations.stream().map(r -> r.getEvent().getId()).toList();
            return announcementRepository.findByEventIdInOrEventIsNullOrderByTimestampDesc(eventIds);
        }
        return announcementRepository.findAllByOrderByTimestampDesc();
    }

    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }
}
