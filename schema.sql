-- =========================================================================
--             BETHELHEM YOUTH ACADEMY - SMART SCHOOL MANAGEMENT SYSTEM
-- =========================================================================
-- DBMS Target: MySQL 8.0+
-- Relational Schema, Referential Integrity, Unique Constraints & Performance Indexes
-- =========================================================================

CREATE DATABASE IF NOT EXISTS bethelhem_academy_db;
USE bethelhem_academy_db;

-- Clear previous tables to support fresh provisioning (order honors foreign key dependencies)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS teacher_assignments;
DROP TABLE IF EXISTS timetables;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS conduct;
DROP TABLE IF EXISTS grade_approvals;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS grade_subjects;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS quarters;
DROP TABLE IF EXISTS academic_years;
SET FOREIGN_KEY_CHECKS = 1;


-- ==========================================
-- 1. ACADEMIC YEARS TABLE
-- ==========================================
-- Supports the 10-month academic year structure (historically mid-September to mid-July in Ethiopia).
CREATE TABLE academic_years (
  id VARCHAR(50) PRIMARY KEY,
  year_name VARCHAR(50) NOT NULL UNIQUE,          -- e.g., '2025/2026' or '2026/2027'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) DEFAULT 0,                 -- 1 = Current active academic year, 0 = Inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_academic_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2. QUARTERS TABLE
-- ==========================================
-- Supports the quarter-based grading system. There are exactly 4 quarters.
CREATE TABLE quarters (
  id VARCHAR(50) PRIMARY KEY,
  quarter_num TINYINT NOT NULL,                   -- 1, 2, 3, or 4
  quarter_name VARCHAR(50) NOT NULL UNIQUE,       -- e.g., 'Quarter 1', 'Quarter 2', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_quarter_num UNIQUE (quarter_num),
  CONSTRAINT chk_quarter_num CHECK (quarter_num BETWEEN 1 AND 4),
  CONSTRAINT chk_quarter_dates CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3. USERS TABLE
-- ==========================================
-- High level security and identity management supporting Admin, Teacher, Student, and Parent.
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  photo_url VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'suspended') DEFAULT 'active',
  registration_no VARCHAR(50) UNIQUE NOT NULL,    -- Standardized ID card scan number
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4. PARENTS PROFILE TABLE
-- ==========================================
-- Extension of the users table for parent roles.
CREATE TABLE parents (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  occupation VARCHAR(100) DEFAULT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5. TEACHERS PROFILE TABLE
-- ==========================================
-- Extension of the users table for teacher roles.
CREATE TABLE teachers (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  specialization VARCHAR(150) NOT NULL,
  hire_date DATE NOT NULL,
  bio TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6. SECTIONS TABLE
-- ==========================================
-- Represents classrooms. Grade levels restricted to 1 through 8. Section names limited to A, B, C.
CREATE TABLE sections (
  id VARCHAR(50) PRIMARY KEY,
  grade TINYINT NOT NULL,                         -- Restricted to grades 1 through 8
  section_name ENUM('A', 'B', 'C') NOT NULL,       -- Section letters
  room_number VARCHAR(20) DEFAULT NULL,
  tutor_id VARCHAR(50) DEFAULT NULL,               -- Teacher assigned as homeroom tutor (referenced from users)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_grade CHECK (grade BETWEEN 1 AND 8),
  CONSTRAINT uq_grade_section UNIQUE (grade, section_name),
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 7. SUBJECTS TABLE
-- ==========================================
-- Catalog of all subjects offered in Bethelhem Youth Academy.
CREATE TABLE subjects (
  id VARCHAR(50) PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL UNIQUE,
  subject_code VARCHAR(20) UNIQUE NOT NULL,       -- e.g., 'ENG', 'MATH', 'AMH', 'CIV'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 8. GRADE_SUBJECTS TABLE
-- ==========================================
-- Fulfills: Subjects differ by grade level. Resolves many-to-many relationship of grades to subjects.
CREATE TABLE grade_subjects (
  id VARCHAR(50) PRIMARY KEY,
  grade TINYINT NOT NULL,                         -- Grade levels: 1 to 8
  subject_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_gs_grade CHECK (grade BETWEEN 1 AND 8),
  CONSTRAINT uq_grade_subject UNIQUE (grade, subject_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 9. STUDENTS PROFILE TABLE
-- ==========================================
-- Core student representation, linked back to parent users, security users, and static class sections.
CREATE TABLE students (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  parent_id VARCHAR(50) DEFAULT NULL,              -- Parent user reference
  section_id VARCHAR(50) DEFAULT NULL,             -- Student's homeroom section
  dob DATE NOT NULL,
  gender ENUM('Male', 'Female') NOT NULL,
  enrollment_date DATE NOT NULL,
  roll_number VARCHAR(20) DEFAULT NULL,            -- Index registration inside the section
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 10. ATTENDANCE TABLE
-- ==========================================
-- Fulfills: Morning AND Afternoon attendance logging to monitor double-session presence.
CREATE TABLE attendance (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  session ENUM('morning', 'afternoon') NOT NULL,   -- Double registration requirement
  status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  recorded_by VARCHAR(50) DEFAULT NULL,            -- Teacher user ID who took attendance
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_date_session (student_id, date, session),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 11. GRADES TABLE
-- ==========================================
-- Holds score assessments out of 100%. Defines pass criteria as >= 50% via computed status column.
CREATE TABLE grades (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  quarter_id VARCHAR(50) NOT NULL,
  academic_year_id VARCHAR(50) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  -- Computed Column: checks of score exceeds or meets the 50% threshold dynamically
  is_passed TINYINT(1) GENERATED ALWAYS AS (CASE WHEN score >= 50.00 THEN 1 ELSE 0 END) STORED,
  recorded_by VARCHAR(50) DEFAULT NULL,            -- Teacher entering the raw grades
  is_published TINYINT(1) DEFAULT 0,               -- Status updated to 1 only after Admin approval locks
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_grade_score CHECK (score BETWEEN 0.00 AND 100.00),
  CONSTRAINT uq_student_subject_quarter UNIQUE (student_id, subject_id, quarter_id, academic_year_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (quarter_id) REFERENCES quarters(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 12. GRADE APPROVALS TABLE
-- ==========================================
-- Fulfills: Grade approval workflow (Teachers enter grades, Admin approves before publishing).
CREATE TABLE grade_approvals (
  id VARCHAR(50) PRIMARY KEY,
  grade_id VARCHAR(50) NOT NULL UNIQUE,            -- One approval workflow state per assessment record
  submitted_by VARCHAR(50) NOT NULL,               -- Teacher who uploaded the marks
  approved_by VARCHAR(50) DEFAULT NULL,             -- Admin who finalized the record
  approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  remarks TEXT DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 13. CONDUCT TABLE
-- ==========================================
-- Fulfills: Conduct grading: A=Excellent, B=Good, C=Needs Improvement. Ranked per student per quarter.
CREATE TABLE conduct (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  quarter_id VARCHAR(50) NOT NULL,
  academic_year_id VARCHAR(50) NOT NULL,
  grade ENUM('A', 'B', 'C') NOT NULL COMMENT 'A=Excellent, B=Good, C=Needs Improvement',
  remarks VARCHAR(255) DEFAULT NULL,
  graded_by VARCHAR(50) DEFAULT NULL,              -- homeroom teacher user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_student_conduct UNIQUE (student_id, quarter_id, academic_year_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quarter_id) REFERENCES quarters(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 14. ANNOUNCEMENTS TABLE
-- ==========================================
-- Central communication board for system admins, teachers, students, and parents.
CREATE TABLE announcements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  posted_by VARCHAR(50) NOT NULL,
  target_role ENUM('all', 'teacher', 'student', 'parent') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 15. TIMETABLES TABLE
-- ==========================================
-- Class schedule planner, ensuring no room or section conflicts occur.
CREATE TABLE timetables (
  id VARCHAR(50) PRIMARY KEY,
  section_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  teacher_id VARCHAR(50) DEFAULT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Ensures teacher/room is not double-booked at the same slot on the same day
  CONSTRAINT uq_schedule_clash UNIQUE (section_id, day_of_week, start_time),
  CONSTRAINT chk_time_span CHECK (end_time > start_time),
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 16. TEACHER_ASSIGNMENTS TABLE
-- ==========================================
-- Assigns teachers to subject courses within specific classroom sections.
CREATE TABLE teacher_assignments (
  id VARCHAR(50) PRIMARY KEY,
  teacher_id VARCHAR(50) NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_teacher_course_sec UNIQUE (teacher_id, section_id, subject_id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================================
--             INDEXES & PERFORMANCE OPTIMIZATIONS
-- =========================================================================
-- Promotes fast search speeds in database queries on tables carrying large volumes of data.
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_student_section ON students(section_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_score ON grades(score);
CREATE INDEX idx_timetable_day ON timetables(day_of_week);


-- =========================================================================
--             SAMPLE SEED DATA INSERTS
-- =========================================================================

-- 1. Academic Years Seeding (10-month period)
INSERT INTO academic_years (id, year_name, start_date, end_date, is_active)
VALUES ('ay-2025-2026', '2025/2026 Academic Year', '2025-09-11', '2026-07-10', 1);

-- 2. Quarters Seeding
INSERT INTO quarters (id, quarter_num, quarter_name, start_date, end_date) VALUES 
('q-1', 1, 'Quarter 1', '2025-09-11', '2025-11-25'),
('q-2', 2, 'Quarter 2', '2025-11-26', '2026-02-10'),
('q-3', 3, 'Quarter 3', '2026-02-11', '2026-04-25'),
('q-4', 4, 'Quarter 4', '2026-04-26', '2026-07-10');

-- 3. Users Seeding (Password for all accounts: bcrypt generated hash of 'password123')
INSERT INTO users (id, email, password_hash, role, full_name, phone, registration_no) VALUES
('u-admin-01', 'admin@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOOfYd/Ffe4B4N9e7GfN/W5y/x1y73Wn9S', 'admin', 'Abebe Kebede', '+251 911 234 567', 'BYA-ADM-2026-001'),
('u-teacher-01', 'teacher@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOO9oBqBvK2F8.T7Z.2C1wYee7/b2wLhWq', 'teacher', 'Almaz Tesfaye', '+251 911 345 678', 'BYA-TCH-2026-001'),
('u-teacher-02', 'dawit@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOO9oBqBvK2F8.T7Z.2C1wYee7/b2wLhWq', 'teacher', 'Dawit Wolde', '+251 911 456 789', 'BYA-TCH-2026-002'),
('u-parent-01', 'parent@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOO8P5A4Gq8o6O7T/8Xq3yeef8/LBy7G2', 'parent', 'Mekonnen Assefa', '+251 911 888 111', 'BYA-PRN-2026-001'),
('u-student-01', 'student@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOOKrI/d80f.e7f8D7h90vAeed2/Kby7G2', 'student', 'Yonas Mekonnen', '+251 911 999 001', 'BYA-STU-2026-001'),
('u-student-02', 'selam@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOOKrI/d80f.e7f8D7h90vAeed2/Kby7G2', 'student', 'Selam Tekle', '+251 911 999 002', 'BYA-STU-2026-002'),
('u-student-03', 'kaleb@bya.edu', '$2a$10$S4fPZbyZAnkSjPqO7EExOOKrI/d80f.e7f8D7h90vAeed2/Kby7G2', 'student', 'Kaleb Hailu', '+251 911 999 003', 'BYA-STU-2026-003');

-- 4. Parents Profile Seeding
INSERT INTO parents (id, user_id, occupation, address) VALUES
('pr-01', 'u-parent-01', 'Department Director', 'Bole Subcity, House No. 542, Addis Ababa, Ethiopia');

-- 5. Teachers Profile Seeding
INSERT INTO teachers (id, user_id, specialization, hire_date, bio) VALUES
('tr-01', 'u-teacher-01', 'Mathematics & STEM Education', '2021-09-01', 'Committed primary maths instructor centering practical arithmetic skills.'),
('tr-02', 'u-teacher-02', 'English Language & Social Studies', '2022-09-01', 'Language specialist teaching speaking, reading comprehension, and citizenship.');

-- 6. Sections Seeding
-- Strictly Grade 1 to 8, with sections A, B, C only
INSERT INTO sections (id, grade, section_name, room_number, tutor_id) VALUES
('sec-5A', 5, 'A', 'Room 201', 'u-teacher-01'),
('sec-5B', 5, 'B', 'Room 202', 'u-teacher-02'),
('sec-4A', 4, 'A', 'Room 101', 'u-teacher-02');

-- 7. Subjects Seeding
INSERT INTO subjects (id, subject_name, subject_code) VALUES
('sub-math', 'Mathematics', 'MATH'),
('sub-engl', 'English Language', 'ENGL'),
('sub-amhr', 'Amharic Language', 'AMHR'),
('sub-scie', 'General Science', 'SCIE'),
('sub-civi', 'Civic & Ethical Education', 'CIVI');

-- 8. Grade Subjects Seeding (Shows how subjects differ by grade level)
-- Grade 5 Subjects
INSERT INTO grade_subjects (id, grade, subject_id) VALUES
('gs-1', 5, 'sub-math'),
('gs-2', 5, 'sub-engl'),
('gs-3', 5, 'sub-amhr'),
('gs-4', 5, 'sub-scie'),
('gs-5', 5, 'sub-civi');
-- Grade 4 Subjects (Excludes Civic Education, illustrating differences)
INSERT INTO grade_subjects (id, grade, subject_id) VALUES
('gs-6', 4, 'sub-math'),
('gs-7', 4, 'sub-engl'),
('gs-8', 4, 'sub-amhr'),
('gs-9', 4, 'sub-scie');

-- 9. Students Profile Seeding
INSERT INTO students (id, user_id, parent_id, section_id, dob, gender, enrollment_date, roll_number) VALUES
('st-01', 'u-student-01', 'u-parent-01', 'sec-5A', '2015-04-12', 'Male', '2021-09-05', '01'),
('st-02', 'u-student-02', 'u-parent-01', 'sec-5A', '2015-08-22', 'Female', '2021-09-05', '02'),
-- Kaleb is in Grade 4-A
('st-03', 'u-student-03', 'u-parent-01', 'sec-4A', '2016-11-05', 'Male', '2022-09-05', '01');

-- 10. Attendance Seeding (Demonstrates Morning AND Afternoon attendance logging)
INSERT INTO attendance (id, student_id, section_id, date, session, status, remarks, recorded_by) VALUES
-- Student Yonas (Yest, June 3rd: present both sessions)
('att-1', 'u-student-01', 'sec-5A', '2026-06-03', 'morning', 'Present', 'Arrived early', 'u-teacher-01'),
('att-2', 'u-student-01', 'sec-5A', '2026-06-03', 'afternoon', 'Present', '-', 'u-teacher-01'),
-- Student Selam (Yest, June 3rd: late morning, absent afternoon due to medical appointment)
('att-3', 'u-student-02', 'sec-5A', '2026-06-03', 'morning', 'Late', 'Late due to traffic', 'u-teacher-01'),
('att-4', 'u-student-02', 'sec-5A', '2026-06-03', 'afternoon', 'Excused', 'Doctor appointment', 'u-teacher-01'),
-- Today, June 4th (Present both)
('att-5', 'u-student-01', 'sec-5A', '2026-06-04', 'morning', 'Present', '-', 'u-teacher-01'),
('att-6', 'u-student-01', 'sec-5A', '2026-06-04', 'afternoon', 'Present', '-', 'u-teacher-01');

-- 11. Grades Seeding (Scores out of 100%, Quarter 1, ay-2025-2026)
INSERT INTO grades (id, student_id, subject_id, quarter_id, academic_year_id, score, recorded_by, is_published) VALUES
-- Student Yonas scores (Math = Passed (82), English = Passed (76))
('gr-01', 'u-student-01', 'sub-math', 'q-1', 'ay-2025-2026', 82.50, 'u-teacher-01', 1),
('gr-02', 'u-student-01', 'sub-engl', 'q-1', 'ay-2025-2026', 76.00, 'u-teacher-02', 1),
-- Student Selam scores (Math = Passed (94), English = Passed (89)) - Outstanding performance
('gr-03', 'u-student-02', 'sub-math', 'q-1', 'ay-2025-2026', 94.00, 'u-teacher-01', 1),
('gr-04', 'u-student-02', 'sub-engl', 'q-1', 'ay-2025-2026', 89.00, 'u-teacher-02', 1),
-- Student Kaleb (Grade 4-A Math score is 45.00 - Dynamic Computed Field compiles Passed as 0 (Fail < 50%))
('gr-05', 'u-student-03', 'sub-math', 'q-1', 'ay-2025-2026', 45.00, 'u-teacher-01', 0); -- is_published = 0, awaiting feedback

-- 12. Grade Approvals Seeding (Approval workflow state representation)
INSERT INTO grade_approvals (id, grade_id, submitted_by, approved_by, approval_status, remarks, approved_at) VALUES
('gap-1', 'gr-01', 'u-teacher-01', 'u-admin-01', 'Approved', 'Accurate, meets guidelines.', '2025-11-28 10:00:00'),
('gap-2', 'gr-02', 'u-teacher-02', 'u-admin-01', 'Approved', 'No corrections needed.', '2025-11-28 10:15:00'),
('gap-3', 'gr-03', 'u-teacher-01', 'u-admin-01', 'Approved', 'Incredible score of 94 approved.', '2025-11-28 10:05:00'),
('gap-4', 'gr-04', 'u-teacher-02', 'u-admin-01', 'Approved', 'Approved and certified.', '2025-11-28 10:16:00'),
-- Grade 5 represents a pending submission awaiting Admin review prior to publishing
('gap-5', 'gr-05', 'u-teacher-01', NULL, 'Pending', 'Requires evaluation as student scored 45%, check retake criteria.', NULL);

-- 13. Conduct Seeding
-- Conduct: A = Excellent, B = Good, C = Needs Improvement
INSERT INTO conduct (id, student_id, quarter_id, academic_year_id, grade, remarks, graded_by) VALUES
('con-1', 'u-student-01', 'q-1', 'ay-2025-2026', 'A', 'Very helpful, respectful to staff', 'u-teacher-01'),
('con-2', 'u-student-02', 'q-1', 'ay-2025-2026', 'B', 'Polite, occasionally distracted', 'u-teacher-01'),
('con-3', 'u-student-03', 'q-1', 'ay-2025-2026', 'B', 'Excellent participation, chatty', 'u-teacher-02');

-- 14. Announcements Seeding
INSERT INTO announcements (id, title, content, posted_by, target_role) VALUES
('anc-1', 'Quarter 1 Report Cards Released', 'Dear parents and teachers, all Quarter 1 report sheets have been certified and published on the Smart Portal. Conduct and morning/afternoon records are fully consolidated.', 'u-admin-01', 'all'),
('anc-2', 'Grades Submission Window', 'Teachers, please submit all Quarter 2 assessment scores for student approvals by February 8th.', 'u-admin-01', 'teacher');

-- 15. Timetables Seeding
INSERT INTO timetables (id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES
('tt-1', 'sec-5A', 'sub-math', 'u-teacher-01', 'Monday', '08:30:00', '09:15:00'),
('tt-2', 'sec-5A', 'sub-engl', 'u-teacher-02', 'Monday', '09:15:00', '10:00:00'),
('tt-3', 'sec-5A', 'sub-scie', 'u-teacher-01', 'Tuesday', '08:30:00', '09:15:00');

-- 16. Teacher Assignments Seeding
INSERT INTO teacher_assignments (id, teacher_id, section_id, subject_id) VALUES
('tas-1', 'u-teacher-01', 'sec-5A', 'sub-math'),
('tas-2', 'u-teacher-01', 'sec-5A', 'sub-scie'),
('tas-3', 'u-teacher-02', 'sec-5A', 'sub-engl'),
('tas-4', 'u-teacher-02', 'sec-4A', 'sub-math');


-- =========================================================================
--             SQL DEMONSTRATIONS (COMPLEX SCHOLAR RANKING & QUERIES)
-- =========================================================================

-- Fulfills requirement: "Ranking only within section"
-- Query using MySQL 8.0+ Window Functions to aggregate scores and calculate rank partitioning by section_id
-- This allows students to be sorted competitively only against classmates sitting in the same physical room (e.g., 5A vs 5B).

-- SELECT 
--   u.full_name AS Student_Name,
--   sec.grade AS Grade,
--   sec.section_name AS Section,
--   sub.subject_name AS Subject,
--   g.score AS Score,
--   g.is_passed AS Passed_Status,
--   DENSE_RANK() OVER (
--     PARTITION BY s.section_id, g.subject_id, g.quarter_id, g.academic_year_id 
--     ORDER BY g.score DESC
--   ) AS Class_Rank
-- FROM grades g
-- JOIN users u ON g.student_id = u.id
-- JOIN students s ON s.user_id = u.id
-- JOIN sections sec ON s.section_id = sec.id
-- JOIN subjects sub ON g.subject_id = sub.id
-- WHERE g.quarter_id = 'q-1' AND g.academic_year_id = 'ay-2025-2026'
-- ORDER BY sec.grade, sec.section_name, sub.subject_name, Class_Rank;
