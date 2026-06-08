package com.eventbridge.service;

import com.eventbridge.model.*;
import com.eventbridge.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RegistrationService {
    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private ODApprovalRepository odApprovalRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Registration registerIndividual(Long eventId, User participant) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getRegistrationDeadline().isBefore(LocalDate.now())) {
            throw new RuntimeException("Registration deadline has passed");
        }

        if (registrationRepository.existsByParticipantIdAndEventId(participant.getId(), eventId)) {
            throw new RuntimeException("You are already registered for this event");
        }

        Registration registration = Registration.builder()
                .event(event)
                .participant(participant)
                .team(null)
                .status("PENDING") 
                .paymentStatus(event.getEntryFee() > 0 ? "PENDING" : "PAID")
                .build();

        Registration saved = registrationRepository.save(registration);

        // Send confirmation email to participant
        emailService.sendRegistrationEmail(
                participant.getEmail(),
                participant.getFullName(),
                event.getEventName(),
                event.getEventDate().toString(),
                event.getVenue(),
                null,
                event.getEntryFee()
        );

        // Notify event organizer about new registration
        emailService.sendNewRegistrationNotificationToOrganizer(
                event.getOrganizer().getEmail(),
                event.getOrganizer().getFullName(),
                participant.getFullName(),
                event.getEventName(),
                event.getEventDate().toString(),
                null
        );

        // Save notification
        notificationService.createNotification(participant, "Successfully registered for " + event.getEventName() + ". Waiting for organizer approval.");

        return saved;
    }

    @Transactional
    public Team registerTeam(Long eventId, String teamName, User leader, List<String> memberUsernames) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getRegistrationDeadline().isBefore(LocalDate.now())) {
            throw new RuntimeException("Registration deadline has passed");
        }

        if (memberUsernames.size() + 1 > event.getTeamLimit()) {
            throw new RuntimeException("Team size exceeds the event limit of " + event.getTeamLimit());
        }

        // Save Team
        Team team = Team.builder()
                .teamName(teamName)
                .event(event)
                .createdBy(leader)
                .build();
        Team savedTeam = teamRepository.save(team);

        // Register leader
        if (registrationRepository.existsByParticipantIdAndEventId(leader.getId(), eventId)) {
            throw new RuntimeException("Leader is already registered for this event");
        }
        Registration leaderReg = Registration.builder()
                .event(event)
                .participant(leader)
                .team(savedTeam)
                .status("PENDING")
                .paymentStatus(event.getEntryFee() > 0 ? "PENDING" : "PAID")
                .build();
        registrationRepository.save(leaderReg);

        emailService.sendRegistrationEmail(leader.getEmail(), leader.getFullName(), event.getEventName(), event.getEventDate().toString(), event.getVenue(), teamName, event.getEntryFee());
        // Notify organizer about new team registration
        emailService.sendNewRegistrationNotificationToOrganizer(
                event.getOrganizer().getEmail(),
                event.getOrganizer().getFullName(),
                leader.getFullName(),
                event.getEventName(),
                event.getEventDate().toString(),
                teamName
        );
        notificationService.createNotification(leader, "Successfully registered team '" + teamName + "' for " + event.getEventName());

        // Register members
        for (String username : memberUsernames) {
            User member = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Member user not found: " + username));
            
            if (registrationRepository.existsByParticipantIdAndEventId(member.getId(), eventId)) {
                throw new RuntimeException("Member " + username + " is already registered for this event");
            }

            Registration memberReg = Registration.builder()
                    .event(event)
                    .participant(member)
                    .team(savedTeam)
                    .status("PENDING")
                    .paymentStatus(event.getEntryFee() > 0 ? "PENDING" : "PAID")
                    .build();
            registrationRepository.save(memberReg);

            emailService.sendRegistrationEmail(member.getEmail(), member.getFullName(), event.getEventName(), event.getEventDate().toString(), event.getVenue(), teamName, event.getEntryFee());
            notificationService.createNotification(member, "You have been registered in team '" + teamName + "' for " + event.getEventName());
        }

        return savedTeam;
    }

    @Transactional
    public Registration updateRegistrationStatus(Long registrationId, String status) {
        Registration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
        reg.setStatus(status);
        Registration updated = registrationRepository.save(reg);

        // Notify user
        notificationService.createNotification(
                reg.getParticipant(), 
                "Your registration for '" + reg.getEvent().getEventName() + "' has been " + status
        );
        emailService.sendRegistrationStatusEmail(
                reg.getParticipant().getEmail(), 
                reg.getParticipant().getFullName(), 
                reg.getEvent().getEventName(), 
                status
        );

        // If approved, create OD Approval request automatically
        if ("APPROVED".equalsIgnoreCase(status)) {
            Optional<ODApproval> existingOD = odApprovalRepository.findByRegistrationId(registrationId);
            if (existingOD.isEmpty()) {
                ODApproval od = ODApproval.builder()
                        .registration(reg)
                        .student(reg.getParticipant())
                        .event(reg.getEvent())
                        .approvalStatus("PENDING")
                        .build();
                odApprovalRepository.save(od);
            }
        }

        return updated;
    }

    @Transactional
    public Registration updatePaymentStatus(Long registrationId, String paymentStatus) {
        Registration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
        reg.setPaymentStatus(paymentStatus);
        Registration saved = registrationRepository.save(reg);

        notificationService.createNotification(
                reg.getParticipant(),
                "Payment status for '" + reg.getEvent().getEventName() + "' is now " + paymentStatus
        );

        return saved;
    }

    @Transactional

    public void cancelRegistration(Long registrationId) {
        Registration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
        
        // Remove related OD approval if any
        Optional<ODApproval> od = odApprovalRepository.findByRegistrationId(registrationId);
        od.ifPresent(odApprovalRepository::delete);

        registrationRepository.delete(reg);
    }

    public List<Registration> getRegistrationsByParticipant(Long participantId) {
        return registrationRepository.findByParticipantId(participantId);
    }

    public List<Registration> getRegistrationsByEvent(Long eventId) {
        return registrationRepository.findByEventId(eventId);
    }
}
