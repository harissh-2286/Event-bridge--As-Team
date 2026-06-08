package com.eventbridge.service;

import com.eventbridge.model.Event;
import com.eventbridge.model.Registration;
import com.eventbridge.model.User;
import com.eventbridge.repository.EventRepository;
import com.eventbridge.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class EventService {
    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    public Event createEvent(Event event, User organizer) {
        event.setOrganizer(organizer);
        event.setStatus("ACTIVE");
        return eventRepository.save(event);
    }

    public Event updateEvent(Long eventId, Event eventDetails) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        event.setEventName(eventDetails.getEventName());
        event.setEventDate(eventDetails.getEventDate());
        event.setEventTime(eventDetails.getEventTime());
        event.setVenue(eventDetails.getVenue());
        event.setDescription(eventDetails.getDescription());
        event.setTeamLimit(eventDetails.getTeamLimit());
        event.setEntryFee(eventDetails.getEntryFee());
        event.setCategory(eventDetails.getCategory());
        event.setRegistrationDeadline(eventDetails.getRegistrationDeadline());
        if (eventDetails.getBannerUrl() != null) {
            event.setBannerUrl(eventDetails.getBannerUrl());
        }

        Event updated = eventRepository.save(event);

        // Notify registered participants about update
        List<Registration> registrations = registrationRepository.findByEventId(eventId);
        for (Registration reg : registrations) {
            String msg = "The event details for '" + updated.getEventName() + "' have been updated.";
            notificationService.createNotification(reg.getParticipant(), msg);
            emailService.sendEventUpdateEmail(
                    reg.getParticipant().getEmail(), 
                    reg.getParticipant().getFullName(), 
                    updated.getEventName(), 
                    "The event details (time, venue, or date) have changed. Please check the website portal."
            );
        }

        return updated;
    }

    @Transactional
    public Event cancelEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus("CANCELLED");
        Event cancelled = eventRepository.save(event);

        // Notify participants about cancellation
        List<Registration> registrations = registrationRepository.findByEventId(eventId);
        for (Registration reg : registrations) {
            String msg = "The event '" + cancelled.getEventName() + "' has been cancelled.";
            notificationService.createNotification(reg.getParticipant(), msg);
            emailService.sendEventCancellationEmail(
                    reg.getParticipant().getEmail(), 
                    reg.getParticipant().getFullName(), 
                    cancelled.getEventName()
            );
        }

        return cancelled;
    }

    public void deleteEvent(Long eventId) {
        eventRepository.deleteById(eventId);
    }

    public Optional<Event> getEventById(Long eventId) {
        return eventRepository.findById(eventId);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<Event> getUpcomingEvents() {
        return eventRepository.findUpcomingEvents(LocalDate.now());
    }

    public List<Event> getEventsByOrganizer(Long organizerId) {
        return eventRepository.findByOrganizerId(organizerId);
    }

    public List<Event> searchEvents(String query) {
        return eventRepository.searchEvents(query);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        List<Event> allEvents = eventRepository.findAll();
        List<Registration> allRegistrations = registrationRepository.findAll();
        
        long activeEvents = allEvents.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count();
        long cancelledEvents = allEvents.size() - activeEvents;

        stats.put("totalEvents", allEvents.size());
        stats.put("activeEvents", activeEvents);
        stats.put("cancelledEvents", cancelledEvents);
        stats.put("totalRegistrations", allRegistrations.size());
        
        long approvedRegs = allRegistrations.stream().filter(r -> "APPROVED".equals(r.getStatus())).count();
        long pendingRegs = allRegistrations.stream().filter(r -> "PENDING".equals(r.getStatus())).count();
        stats.put("approvedRegistrations", approvedRegs);
        stats.put("pendingRegistrations", pendingRegs);

        // Participation per event
        Map<String, Long> eventParticipation = new HashMap<>();
        for (Event e : allEvents) {
            long count = allRegistrations.stream().filter(r -> r.getEvent().getId().equals(e.getId())).count();
            eventParticipation.put(e.getEventName(), count);
        }
        stats.put("eventParticipation", eventParticipation);

        return stats;
    }
}
