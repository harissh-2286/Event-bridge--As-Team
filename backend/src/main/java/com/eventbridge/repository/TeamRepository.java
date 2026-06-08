package com.eventbridge.repository;

import com.eventbridge.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByEventId(Long eventId);
    List<Team> findByCreatedById(Long createdById);
}
