package com.eventbridge.repository;

import com.eventbridge.model.ODApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ODApprovalRepository extends JpaRepository<ODApproval, Long> {
    List<ODApproval> findByStudentId(Long studentId);
    List<ODApproval> findByFacultyId(Long facultyId);
    List<ODApproval> findByApprovalStatus(String approvalStatus);
    Optional<ODApproval> findByRegistrationId(Long registrationId);
}
