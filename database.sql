-- ==========================================
-- Event Bridge - MySQL Database Schema
-- ==========================================

CREATE DATABASE IF NOT EXISTS event_bridge_db;
USE event_bridge_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'ORGANIZER', 'FACULTY', 'PARTICIPANT'
    full_name VARCHAR(100) NOT NULL,
    register_number VARCHAR(50) DEFAULT NULL,
    department VARCHAR(50) DEFAULT NULL,
    online_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    team_limit INT NOT NULL DEFAULT 1, -- 1 = Individual, >1 = Team Event
    entry_fee DOUBLE NOT NULL DEFAULT 0.0,
    category VARCHAR(50) NOT NULL, -- e.g., 'Technical', 'Non-Technical', 'Sports', 'Cultural'
    banner_url VARCHAR(255) DEFAULT NULL,
    registration_deadline DATE NOT NULL,
    organizer_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    event_id BIGINT NOT NULL,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    team_id BIGINT DEFAULT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID'
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_event (participant_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Messages Table (Real-time Chat)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    message_content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. OD Approvals Table (On-Duty Management)
CREATE TABLE IF NOT EXISTS od_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    faculty_id BIGINT DEFAULT NULL, -- assigned faculty for approval
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    date_requested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_approved TIMESTAMP NULL DEFAULT NULL,
    pdf_path VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT DEFAULT NULL, -- Can be NULL for general announcements
    sender_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Sample Test Data (Passwords are 'password123' BCrypt hashed)
-- Hashed: $2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O
-- ==========================================

INSERT INTO users (username, email, password, role, full_name, register_number, department, online_status) VALUES
('admin', 'admin@eventbridge.edu', '$2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O', 'ADMIN', 'System Admin', NULL, 'IT Support', FALSE),
('organizer', 'organizer@eventbridge.edu', '$2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O', 'ORGANIZER', 'John Doe (CSE Convener)', NULL, 'Computer Science', FALSE),
('faculty', 'faculty@eventbridge.edu', '$2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O', 'FACULTY', 'Dr. Sarah Connor', NULL, 'Computer Science', FALSE),
('student1', 'student1@eventbridge.edu', '$2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O', 'PARTICIPANT', 'Alice Smith', 'CSE2023001', 'Computer Science', FALSE),
('student2', 'student2@eventbridge.edu', '$2a$10$d6A5W/C7h9n3Uq/DbeDskOk84eP6f5W3VlM067pXgEqqO6V2mJ/8O', 'PARTICIPANT', 'Bob Johnson', 'ECE2023045', 'Electronics', FALSE);

INSERT INTO events (event_name, event_date, event_time, venue, description, team_limit, entry_fee, category, banner_url, registration_deadline, organizer_id, status) VALUES
('HackCSE 2026', '2026-06-15', '09:00:00', 'Main CSE Block Labs', 'A 24-hour national level hackathon to solve real-world industrial problems.', 4, 150.00, 'Technical', '/images/hackathon.jpg', '2026-06-10', 2, 'ACTIVE'),
('RoboWars', '2026-06-18', '10:30:00', 'College Open Auditorium', 'Bring your metal warriors and fight for glory in the arena.', 3, 200.00, 'Technical', '/images/robowars.jpg', '2026-06-12', 2, 'ACTIVE'),
('ChoreoNight', '2026-06-20', '18:00:00', 'Main College Ground', 'Inter-department dance face-off. Show your rhythm and dance style.', 8, 0.00, 'Cultural', '/images/cultural.jpg', '2026-06-16', 2, 'ACTIVE');
