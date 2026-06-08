package com.eventbridge.service;

import com.eventbridge.model.Message;
import com.eventbridge.model.User;
import com.eventbridge.repository.MessageRepository;
import com.eventbridge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Message sendMessage(Long senderId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .messageContent(content)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // Send real-time chat message to the receiver
        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getUsername(),
                    "/queue/messages",
                    saved
            );
        } catch (Exception e) {
            // Do not block execution on WS delivery issues
        }

        return saved;
    }

    public List<Message> getChatHistory(Long user1Id, Long user2Id) {
        List<Message> history = messageRepository.findChatHistory(user1Id, user2Id);
        boolean changed = false;
        for (Message m : history) {
            if (m.getReceiver().getId().equals(user1Id) && !m.getIsRead()) {
                m.setIsRead(true);
                changed = true;
            }
        }
        if (changed) {
            messageRepository.saveAll(history);
        }
        return history;
    }

    public List<User> getChatPartners(Long userId) {
        return messageRepository.findChatPartners(userId);
    }

    public void markMessageAsRead(Long messageId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        msg.setIsRead(true);
        messageRepository.save(msg);
    }
}
