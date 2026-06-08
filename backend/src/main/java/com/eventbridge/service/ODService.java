package com.eventbridge.service;

import com.eventbridge.model.ODApproval;
import com.eventbridge.model.User;
import com.eventbridge.repository.ODApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ODService {
    @Autowired
    private ODApprovalRepository odApprovalRepository;

    @Autowired
    private PDFService pdfService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public ODApproval updateODStatus(Long odId, String status, User faculty) {
        ODApproval od = odApprovalRepository.findById(odId)
                .orElseThrow(() -> new RuntimeException("OD Record not found"));

        od.setApprovalStatus(status);
        od.setFaculty(faculty);
        od.setDateApproved(LocalDateTime.now());
        
        ODApproval updated = odApprovalRepository.save(od);

        // Notify Student
        notificationService.createNotification(
                od.getStudent(), 
                "Your On-Duty request for '" + od.getEvent().getEventName() + "' has been " + status
        );
        emailService.sendODStatusEmail(
                od.getStudent().getEmail(), 
                od.getStudent().getFullName(), 
                od.getEvent().getEventName(), 
                status
        );

        return updated;
    }

    public List<ODApproval> getODRequestsByStudent(Long studentId) {
        return odApprovalRepository.findByStudentId(studentId);
    }

    public List<ODApproval> getODRequestsByFaculty(Long facultyId) {
        return odApprovalRepository.findByFacultyId(facultyId);
    }

    public List<ODApproval> getAllODRequests() {
        return odApprovalRepository.findAll();
    }

    public ODApproval getODById(Long odId) {
        return odApprovalRepository.findById(odId)
                .orElseThrow(() -> new RuntimeException("OD record not found"));
    }

    public byte[] getODLetterPdf(Long odId) {
        ODApproval od = getODById(odId);
        if (!"APPROVED".equals(od.getApprovalStatus())) {
            throw new RuntimeException("OD letter can only be downloaded once approved");
        }
        return pdfService.generateODLetter(od);
    }
}
