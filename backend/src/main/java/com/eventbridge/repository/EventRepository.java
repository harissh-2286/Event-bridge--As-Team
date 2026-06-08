package com.eventbridge.repository;

import com.eventbridge.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(String status);
    List<Event> findByOrganizerId(Long organizerId);
    List<Event> findByCategory(String category);
    
    @Query("SELECT e FROM Event e WHERE e.eventDate >= :date AND e.status = 'ACTIVE' ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEvents(LocalDate date);
    
    @Query("SELECT e FROM Event e WHERE LOWER(e.eventName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Event> searchEvents(String query);
}
