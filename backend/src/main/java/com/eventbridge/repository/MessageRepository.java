package com.eventbridge.repository;

import com.eventbridge.model.Message;
import com.eventbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :user1Id AND m.receiver.id = :user2Id) OR (m.sender.id = :user2Id AND m.receiver.id = :user1Id) ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(Long user1Id, Long user2Id);

    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN (SELECT m.sender.id FROM Message m WHERE m.receiver.id = :userId) OR u.id IN (SELECT m.receiver.id FROM Message m WHERE m.sender.id = :userId)")
    List<User> findChatPartners(Long userId);

    Long countByReceiverIdAndIsReadFalse(Long receiverId);
    
    Long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);
}
