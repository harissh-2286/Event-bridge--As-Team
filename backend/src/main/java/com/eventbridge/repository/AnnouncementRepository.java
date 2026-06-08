package com.eventbridge.repository;

import com.eventbridge.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByTimestampDesc();
    List<Announcement> findByEventIdOrderByTimestampDesc(Long eventId);
    List<Announcement> findByEventIdInOrEventIsNullOrderByTimestampDesc(List<Long> eventIds);
}
