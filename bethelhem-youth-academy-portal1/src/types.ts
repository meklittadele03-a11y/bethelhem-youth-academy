/**
 * Shared Type Definitions for Bethelhem Youth Academy Management System
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  status: 'active' | 'suspended';
  registrationNo: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  parentId?: string; // Reference to parent's user_id or profile_id
  classId?: string;
  dob: string;
  gender: 'Male' | 'Female';
  enrollmentDate: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  specialization: string;
  hireDate: string;
  bio?: string;
  assignedGrade?: string;     // e.g. "Grade 1"
  assignedSection?: string;   // e.g. "A"
  assignedSubjects?: string[]; // e.g. ["Math", "English"]
}

export interface ParentProfile {
  id: string;
  userId: string;
  occupation: string;
  address: string;
}

export interface ClassSection {
  id: string;
  className: string; // e.g., Grade 1, Grade 2
  section: string; // e.g., A, B, C
  roomNo: string;
  tutorId?: string; // Teacher User ID
  studentCount?: number;
}

export interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherId?: string; // Teacher User ID
  className?: string; // Grade level
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  session: 'morning' | 'afternoon';
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  term?: 'Term 1' | 'Term 2' | 'Term 3';
  quarter?: 'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4';
  classId?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  date: string;
}

export interface GradeApproval {
  id: string;
  assessmentId: string;
  studentId?: string;
  studentName: string;
  classId?: string;
  subjectId?: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  quarter?: 'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4';
  remarks?: string;
  submittedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number;
}
