package com.eventbridge.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            logger.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }

    public void sendRegistrationEmail(String toEmail, String studentName, String eventName, String date, String venue, String teamName) {
        sendRegistrationEmail(toEmail, studentName, eventName, date, venue, teamName, 0.0);
    }

    public void sendRegistrationEmail(String toEmail, String studentName, String eventName, String date, String venue, String teamName, double entryFee) {
        String subject = "Event Registration Successful - " + eventName;
        String paymentMessage = entryFee > 0 
                ? "<p style='color: #6A0DAD; font-weight: bold;'>⚠️ Payment Required: This event has an entry fee of ₹" + entryFee + ". Please complete your payment in the Event Bridge student portal or send ₹" + entryFee + " directly to UPI ID: <strong>8220452286@fam</strong> to secure your seat.</p>"
                : "<p>This is a free event. No payment is required.</p>";
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>You have successfully registered for <strong>" + eventName + "</strong>.</p>"
                + "<p><strong>Event Details:</strong><br/>"
                + "Date: " + date + "<br/>"
                + "Venue: " + venue + "<br/>"
                + (teamName != null && !teamName.isEmpty() ? "Team Name: " + teamName + "<br/>" : "")
                + "</p>"
                + paymentMessage
                + "<p>Thank you for participating!</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendEventReminderEmail(String toEmail, String studentName, String eventName, String date, String venue) {
        String subject = "Reminder: Upcoming Event " + eventName + " Tomorrow!";
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>This is a reminder that you are registered for <strong>" + eventName + "</strong> which starts tomorrow.</p>"
                + "<p><strong>Event Details:</strong><br/>"
                + "Date: " + date + "<br/>"
                + "Venue: " + venue + "<br/>"
                + "</p>"
                + "<p>Don't forget to attend. See you there!</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendEventUpdateEmail(String toEmail, String studentName, String eventName, String details) {
        String subject = "Update Regarding Event: " + eventName;
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>There is an update regarding the event <strong>" + eventName + "</strong>:</p>"
                + "<p>" + details + "</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendRegistrationStatusEmail(String toEmail, String studentName, String eventName, String status) {
        String subject = "Registration Update - " + eventName;
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>Your registration status for the event <strong>" + eventName + "</strong> has been updated to: <strong>" + status + "</strong>.</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendODStatusEmail(String toEmail, String studentName, String eventName, String status) {
        String subject = "OD Request Update - " + eventName;
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>Your On-Duty (OD) request for <strong>" + eventName + "</strong> has been <strong>" + status + "</strong>.</p>"
                + "<p>You can view and download your OD letter from the portal.</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendEventCancellationEmail(String toEmail, String studentName, String eventName) {
        String subject = "Event Cancelled - " + eventName;
        String body = "<h3>Hello " + studentName + ",</h3>"
                + "<p>We regret to inform you that the event <strong>" + eventName + "</strong> has been cancelled by the organizers.</p>"
                + "<p>Any entry fee paid will be refunded shortly.</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendNewRegistrationNotificationToOrganizer(String toEmail, String organizerName,
                                                            String participantName, String eventName,
                                                            String eventDate, String teamName) {
        String subject = "New Registration Alert - " + eventName;
        String body = "<h3>Hello " + organizerName + ",</h3>"
                + "<p>A new participant has registered for your event <strong>" + eventName + "</strong>.</p>"
                + "<p><strong>Registration Details:</strong><br/>"
                + "Participant: " + participantName + "<br/>"
                + "Event Date: " + eventDate + "<br/>"
                + (teamName != null && !teamName.isEmpty() ? "Team Name: " + teamName + "<br/>" : "Registration Type: Individual<br/>")
                + "</p>"
                + "<p>Please log in to the Event Bridge portal to review and approve the registration.</p>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }

    public void sendNewAnnouncementEmail(String toEmail, String title, String content) {
        String subject = "New Announcement: " + title;
        String body = "<h3>Hello Student,</h3>"
                + "<p>A new announcement was posted on Event Bridge:</p>"
                + "<blockquote><strong>" + title + "</strong><br/>" + content + "</blockquote>"
                + "<p>Regards,<br/>Event Bridge Team</p>";
        sendEmail(toEmail, subject, body);
    }
}
