package com.eventbridge.repository;

import com.eventbridge.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByParticipantId(Long participantId);
    List<Registration> findByEventId(Long eventId);
    Optional<Registration> findByParticipantIdAndEventId(Long participantId, Long eventId);
    Boolean existsByParticipantIdAndEventId(Long participantId, Long eventId);
    Long countByEventId(Long eventId);
    Long countByStatus(String status);
}
