import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, StudentProfile, TeacherProfile, ParentProfile, ClassSection, Subject, AttendanceRecord, AssessmentRecord, GradeApproval } from '../src/types';

// Path for dev file database simulation
const DB_FILE = path.join(process.cwd(), 'server', 'database.json');

export interface ConductRecord {
  id: string;
  studentId: string;
  studentName: string;
  incidentDate: string;
  conductScore: 'Excellent' | 'Good' | 'Needs Improvement' | 'Unsatisfactory';
  description: string;
  reportedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Teachers' | 'Students' | 'Parents';
  createdAt: string;
  postedBy: string;
  status?: 'Draft' | 'Published';
}

export interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  teacherName: string;
  roomNo: string;
}


// Interface representation for our MySQL simulation JSON
export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // user_id -> password_hash
  students: StudentProfile[];
  teachers: TeacherProfile[];
  parents: ParentProfile[];
  classes: ClassSection[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  assessments: AssessmentRecord[];
  conduct: ConductRecord[];
  announcements: Announcement[];
  timetables: TimetableEntry[];
  gradeApprovals: GradeApproval[];
}

export class DBConnection {
  public data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      passwords: {},
      students: [],
      teachers: [],
      parents: [],
      classes: [],
      subjects: [],
      attendance: [],
      assessments: [],
      conduct: [],
      announcements: [],
      timetables: [],
      gradeApprovals: []
    };
    this.init();
  }

  private init() {
    // Create server directory if not exists
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure new arrays exist in case database.json is from an older seed
        if (!this.data.conduct) this.data.conduct = [];
        if (!this.data.announcements) this.data.announcements = [];
        if (!this.data.timetables) this.data.timetables = [];
        if (!this.data.gradeApprovals) this.data.gradeApprovals = [];
      } catch (err) {
        console.error('Error loading database.json, re-seeding...', err);
        this.seed();
      }
    } else {
      this.seed();
    }
    this.ensureDefaultClasses();
  }

  private ensureDefaultClasses() {
    const grades = [1, 2, 3, 4, 5, 6, 7, 8];
    const sections = ['A', 'B', 'C'];
    let modified = false;

    if (!this.data.classes) {
      this.data.classes = [];
    }

    grades.forEach(g => {
      sections.forEach(sec => {
        const exists = this.data.classes.some(
          c => c.className === `Grade ${g}` && c.section === sec
        );
        if (!exists) {
          this.data.classes.push({
            id: `c-g${g}-${sec.toLowerCase()}`,
            className: `Grade ${g}`,
            section: sec,
            roomNo: `Room ${g}0${sec === 'A' ? '1' : sec === 'B' ? '2' : '3'}`,
            tutorId: undefined
          });
          modified = true;
        }
      });
    });

    if (modified) {
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving state to database.json', err);
    }
  }

  private seed() {
    console.log('Seeding initial relational database for Bethelhem Youth Academy...');

    // Synchronous bcrypt hashing for quick seeding
    const salt = bcrypt.genSaltSync(10);
    const hash = (p: string) => bcrypt.hashSync(p, salt);

    // 1. Initial Users (Admin, Teacher, Student, Parent)
    const adminId = 'u-admin-01';
    const teacherId1 = 'u-teacher-01';
    const teacherId2 = 'u-teacher-02';
    const studentId1 = 'u-student-01';
    const studentId2 = 'u-student-02';
    const studentId3 = 'u-student-03';
    const parentId1 = 'u-parent-01';
    const parentId2 = 'u-parent-02';

    this.data.users = [
      {
        id: adminId,
        email: 'admin@bya.edu',
        role: 'admin',
        fullName: 'Abebe Kebede',
        phone: '+251 911 234 567',
        status: 'active',
        registrationNo: 'BYA-ADM-2026-01',
        createdAt: new Date().toISOString()
      },
      {
        id: teacherId1,
        email: 'teacher@bya.edu',
        role: 'teacher',
        fullName: 'Almaz Tesfaye',
        phone: '+251 911 345 678',
        status: 'active',
        registrationNo: 'BYA-TCH-2026-01',
        createdAt: new Date().toISOString()
      },
      {
        id: teacherId2,
        email: 'dawit@bya.edu',
        role: 'teacher',
        fullName: 'Dawit Wolde',
        phone: '+251 911 456 789',
        status: 'active',
        registrationNo: 'BYA-TCH-2026-02',
        createdAt: new Date().toISOString()
      },
      {
        id: studentId1,
        email: 'student@bya.edu',
        role: 'student',
        fullName: 'Yonas Mekonnen',
        phone: '+251 911 999 001',
        status: 'active',
        registrationNo: 'BYA-STU-2026-01',
        createdAt: new Date().toISOString()
      },
      {
        id: studentId2,
        email: 'selam@bya.edu',
        role: 'student',
        fullName: 'Selam Tekle',
        phone: '+251 911 999 002',
        status: 'active',
        registrationNo: 'BYA-STU-2026-02',
        createdAt: new Date().toISOString()
      },
      {
        id: studentId3,
        email: 'kaleb@bya.edu',
        role: 'student',
        fullName: 'Kaleb Hailu',
        phone: '+251 911 999 003',
        status: 'active',
        registrationNo: 'BYA-STU-2026-03',
        createdAt: new Date().toISOString()
      },
      {
        id: parentId1,
        email: 'parent@bya.edu',
        role: 'parent',
        fullName: 'Mekonnen Assefa',
        phone: '+251 911 888 111',
        status: 'active',
        registrationNo: 'BYA-PRN-2026-01',
        createdAt: new Date().toISOString()
      },
      {
        id: parentId2,
        email: 'helen@bya.edu',
        role: 'parent',
        fullName: 'Helen Teklay',
        phone: '+251 911 888 222',
        status: 'active',
        registrationNo: 'BYA-PRN-2026-02',
        createdAt: new Date().toISOString()
      }
    ];

    // Password seeds
    this.data.passwords = {
      [adminId]: hash('admin123'),
      [teacherId1]: hash('teacher123'),
      [teacherId2]: hash('teacher123'),
      [studentId1]: hash('student123'),
      [studentId2]: hash('student123'),
      [studentId3]: hash('student123'),
      [parentId1]: hash('parent123'),
      [parentId2]: hash('parent123')
    };

    // 2. Classes
    const classId1 = 'c-01'; // Grade 5-A
    const classId2 = 'c-02'; // Grade 5-B
    const classId3 = 'c-03'; // Grade 4-A

    this.data.classes = [
      {
        id: classId1,
        className: 'Grade 5',
        section: 'A',
        roomNo: 'Room 201',
        tutorId: teacherId1
      },
      {
        id: classId2,
        className: 'Grade 5',
        section: 'B',
        roomNo: 'Room 202',
        tutorId: teacherId2
      },
      {
        id: classId3,
        className: 'Grade 4',
        section: 'A',
        roomNo: 'Room 101',
        tutorId: teacherId2
      }
    ];

    // 3. Profiles
    this.data.teachers = [
      {
        id: 'tp-01',
        userId: teacherId1,
        specialization: 'Mathematics & Science',
        hireDate: '2022-09-01',
        bio: 'Dedicated primary educator with over 8 years experience teaching elementary STEM subjects.'
      },
      {
        id: 'tp-02',
        userId: teacherId2,
        specialization: 'English & Social Studies',
        hireDate: '2023-09-01',
        bio: 'Passionate about literature, writing and teaching dynamic communication skills to young pupils.'
      }
    ];

    this.data.parents = [
      {
        id: 'pp-01',
        userId: parentId1,
        occupation: 'Civil Servant',
        address: 'Bole Subcity, House No. 542, Addis Ababa'
      },
      {
        id: 'pp-02',
        userId: parentId2,
        occupation: 'Business Owner',
        address: 'Yeka Subcity, House No. 891, Addis Ababa'
      }
    ];

    this.data.students = [
      {
        id: 'sp-01',
        userId: studentId1,
        parentId: parentId1, // Father Mekonnen
        classId: classId1,  // Grade 5-A
        dob: '2015-04-12',
        gender: 'Male',
        enrollmentDate: '2021-09-05'
      },
      {
        id: 'sp-02',
        userId: studentId2,
        parentId: parentId2, // Mother Helen
        classId: classId1,  // Grade 5-A
        dob: '2015-08-22',
        gender: 'Female',
        enrollmentDate: '2021-09-05'
      },
      {
        id: 'sp-03',
        userId: studentId3,
        parentId: parentId1, // Brother of Yonas, Father Mekonnen
        classId: classId3,  // Grade 4-A
        dob: '2016-11-05',
        gender: 'Male',
        enrollmentDate: '2022-09-05'
      }
    ];

    // 4. Subjects
    const subId1 = 's-01';
    const subId2 = 's-02';
    const subId3 = 's-03';

    this.data.subjects = [
      {
        id: subId1,
        subjectName: 'Mathematics',
        subjectCode: 'MATH-G5',
        teacherId: teacherId1,
        className: 'Grade 5'
      },
      {
        id: subId2,
        subjectName: 'English Language',
        subjectCode: 'ENGL-G5',
        teacherId: teacherId2,
        className: 'Grade 5'
      },
      {
        id: subId3,
        subjectName: 'Social Studies',
        subjectCode: 'SOCS-G5',
        teacherId: teacherId2,
        className: 'Grade 5'
      },
      {
        id: 's-g4-01',
        subjectName: 'General Mathematics',
        subjectCode: 'MATH-G4',
        className: 'Grade 4'
      },
      {
        id: 's-g4-02',
        subjectName: 'Science and Environment',
        subjectCode: 'SCI-G4',
        className: 'Grade 4'
      },
      {
        id: 's-g8-01',
        subjectName: 'Physics',
        subjectCode: 'PHYS-G8',
        className: 'Grade 8'
      },
      {
        id: 's-g8-02',
        subjectName: 'Chemistry',
        subjectCode: 'CHEM-G8',
        className: 'Grade 8'
      },
      {
        id: 's-g8-03',
        subjectName: 'Biology',
        subjectCode: 'BIOL-G8',
        className: 'Grade 8'
      },
      {
        id: 's-g8-04',
        subjectName: 'History',
        subjectCode: 'HIST-G8',
        className: 'Grade 8'
      }
    ];

    // 5. Attendance (Historical and active logs)
    const todayStr = '2026-06-04';
    const yesterdayStr = '2026-06-03';

    this.data.attendance = [
      // Today (June 4, 2026)
      {
        id: 'att-01',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        classId: classId1,
        date: todayStr,
        session: 'morning',
        status: 'Present',
        remarks: 'Active participation in maths'
      },
      {
        id: 'att-01-pm',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        classId: classId1,
        date: todayStr,
        session: 'afternoon',
        status: 'Present',
        remarks: ''
      },
      {
        id: 'att-02',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        classId: classId1,
        date: todayStr,
        session: 'morning',
        status: 'Present',
        remarks: ''
      },
      {
        id: 'att-02-pm',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        classId: classId1,
        date: todayStr,
        session: 'afternoon',
        status: 'Late',
        remarks: 'Slight delay returning from lunch'
      },
      {
        id: 'att-03',
        studentId: studentId3,
        studentName: 'Kaleb Hailu',
        classId: classId3,
        date: todayStr,
        session: 'morning',
        status: 'Late',
        remarks: 'Arrived 15 mins late due to transport'
      },
      {
        id: 'att-03-pm',
        studentId: studentId3,
        studentName: 'Kaleb Hailu',
        classId: classId3,
        date: todayStr,
        session: 'afternoon',
        status: 'Present',
        remarks: ''
      },
      // Yesterday (June 3, 2026)
      {
        id: 'att-04',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        classId: classId1,
        date: yesterdayStr,
        session: 'morning',
        status: 'Present',
        remarks: ''
      },
      {
        id: 'att-04-pm',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        classId: classId1,
        date: yesterdayStr,
        session: 'afternoon',
        status: 'Present',
        remarks: ''
      },
      {
        id: 'att-05',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        classId: classId1,
        date: yesterdayStr,
        session: 'morning',
        status: 'Absent',
        remarks: 'Sick leave, parent notified'
      },
      {
        id: 'att-05-pm',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        classId: classId1,
        date: yesterdayStr,
        session: 'afternoon',
        status: 'Absent',
        remarks: 'Sick leave, parent notified'
      }
    ];

    // 6. Assessments (Marks for students)
    this.data.assessments = [
      {
        id: 'as-01',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        subjectId: subId1,
        subjectName: 'Mathematics',
        marksObtained: 88,
        maxMarks: 100,
        grade: 'A',
        term: 'Term 1',
        remarks: 'Excellent problem solving skills',
        date: '2026-05-15'
      },
      {
        id: 'as-02',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        subjectId: subId2,
        subjectName: 'English Language',
        marksObtained: 79,
        maxMarks: 100,
        grade: 'B',
        term: 'Term 1',
        remarks: 'Good vocabulary development',
        date: '2026-05-18'
      },
      {
        id: 'as-03',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        subjectId: subId1,
        subjectName: 'Mathematics',
        marksObtained: 94,
        maxMarks: 100,
        grade: 'A+',
        term: 'Term 1',
        remarks: 'Top score in class!',
        date: '2026-05-15'
      },
      {
        id: 'as-04',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        subjectId: subId2,
        subjectName: 'English Language',
        marksObtained: 85,
        maxMarks: 100,
        grade: 'A',
        term: 'Term 1',
        remarks: 'Very creative storytelling',
        date: '2026-05-18'
      }
    ];

    // 7. Conduct records
    this.data.conduct = [
      {
        id: 'cnd-01',
        studentId: studentId1,
        studentName: 'Yonas Mekonnen',
        incidentDate: todayStr,
        conductScore: 'Excellent',
        description: 'Exemplary behavior during science practical exam.',
        reportedBy: 'Almaz Tesfaye'
      },
      {
        id: 'cnd-02',
        studentId: studentId2,
        studentName: 'Selam Tekle',
        incidentDate: yesterdayStr,
        conductScore: 'Good',
        description: 'Polite and helpful during class layout preparations.',
        reportedBy: 'Dawit Wolde'
      },
      {
        id: 'cnd-03',
        studentId: studentId3,
        studentName: 'Kaleb Hailu',
        incidentDate: todayStr,
        conductScore: 'Needs Improvement',
        description: 'Did not complete assigned reading; distracted other classmates.',
        reportedBy: 'Almaz Tesfaye'
      }
    ];

    // 8. Announcements
    this.data.announcements = [
      {
        id: 'ann-01',
        title: 'Mid-term Report Clearance Notice',
        content: 'All teachers are requested to compile Term 1 assessments and student conduct scores by index date June 10, 2026 for review.',
        targetAudience: 'Teachers',
        createdAt: todayStr,
        postedBy: 'Abebe Kebede (Admin)'
      },
      {
        id: 'ann-02',
        title: 'Bethelhem Youth Science Fair 2026',
        content: 'Students from Grade 4 and Grade 5 are invited to submit their innovative school models and solar orbit prototypes by next Friday.',
        targetAudience: 'All',
        createdAt: yesterdayStr,
        postedBy: 'Almaz Tesfaye (Tutor)'
      },
      {
        id: 'ann-03',
        title: 'National School Attendance Audit',
        content: 'Parents can view direct, real-time daily child security roll calls. Please make sure phone contacts are updated.',
        targetAudience: 'Parents',
        createdAt: yesterdayStr,
        postedBy: 'Abebe Kebede (Admin)'
      }
    ];

    // 9. Timetables
    this.data.timetables = [
      {
        id: 'tt-01',
        classId: classId1,
        className: 'Grade 5-A',
        subjectName: 'Mathematics',
        dayOfWeek: 'Monday',
        startTime: '08:30 AM',
        endTime: '10:00 AM',
        teacherName: 'Almaz Tesfaye',
        roomNo: 'Room 201'
      },
      {
        id: 'tt-02',
        classId: classId1,
        className: 'Grade 5-A',
        subjectName: 'English Language',
        dayOfWeek: 'Monday',
        startTime: '10:30 AM',
        endTime: '12:00 PM',
        teacherName: 'Dawit Wolde',
        roomNo: 'Room 201'
      },
      {
        id: 'tt-03',
        classId: classId1,
        className: 'Grade 5-A',
        subjectName: 'Social Studies',
        dayOfWeek: 'Tuesday',
        startTime: '01:30 PM',
        endTime: '03:00 PM',
        teacherName: 'Dawit Wolde',
        roomNo: 'Room 201'
      },
      {
        id: 'tt-04',
        classId: classId3,
        className: 'Grade 4-A',
        subjectName: 'Mathematics',
        dayOfWeek: 'Wednesday',
        startTime: '08:30 AM',
        endTime: '10:00 AM',
        teacherName: 'Almaz Tesfaye',
        roomNo: 'Room 101'
      }
    ];

    // 10. Grade Approvals
    this.data.gradeApprovals = [
      {
        id: 'gap-01',
        assessmentId: 'as-01',
        studentName: 'Yonas Mekonnen',
        subjectName: 'Mathematics',
        marksObtained: 88,
        maxMarks: 100,
        grade: 'A',
        submittedBy: 'Almaz Tesfaye',
        status: 'Pending',
        createdAt: todayStr
      },
      {
        id: 'gap-02',
        assessmentId: 'as-02',
        studentName: 'Yonas Mekonnen',
        subjectName: 'English Language',
        marksObtained: 79,
        maxMarks: 100,
        grade: 'B',
        submittedBy: 'Dawit Wolde',
        status: 'Approved',
        createdAt: yesterdayStr
      },
      {
        id: 'gap-03',
        assessmentId: 'as-03',
        studentName: 'Selam Tekle',
        subjectName: 'Mathematics',
        marksObtained: 94,
        maxMarks: 100,
        grade: 'A+',
        submittedBy: 'Almaz Tesfaye',
        status: 'Pending',
        createdAt: todayStr
      }
    ];

    this.save();
    console.log('Database seeded successfully with 8 users in 4 roles.');
  }

  // --- QUERY APIS mimicking SQL operations ---

  public querySelectAllUsers(): User[] {
    return this.data.users;
  }

  public queryUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public queryUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public verifyPassword(userId: string, plainText: string): boolean {
    const hash = this.data.passwords[userId];
    if (!hash) return false;
    return bcrypt.compareSync(plainText, hash);
  }

  public queryStudents(): (StudentProfile & { fullName: string; email: string; registrationNo: string; parentName?: string; parentPhone?: string; className?: string })[] {
    return this.data.students.map(s => {
      const u = this.queryUserById(s.userId);
      const parentUser = s.parentId ? this.queryUserById(s.parentId) : undefined;
      const cls = s.classId ? this.data.classes.find(c => c.id === s.classId) : undefined;
      return {
        ...s,
        fullName: u?.fullName || 'Unknown Student',
        email: u?.email || '',
        registrationNo: u?.registrationNo || '',
        parentName: parentUser?.fullName || 'N/A',
        parentPhone: parentUser?.phone || 'N/A',
        className: cls ? `${cls.className}-${cls.section}` : 'Unassigned'
      };
    });
  }

  public queryTeachers(): (TeacherProfile & { fullName: string; email: string; registrationNo: string; phone?: string })[] {
    return this.data.teachers.map(t => {
      const u = this.queryUserById(t.userId);
      return {
        ...t,
        fullName: u?.fullName || 'Unknown Teacher',
        email: u?.email || '',
        registrationNo: u?.registrationNo || '',
        phone: u?.phone
      };
    });
  }

  public queryParents(): (ParentProfile & { fullName: string; email: string; registrationNo: string; phone?: string })[] {
    return this.data.parents.map(p => {
      const u = this.queryUserById(p.userId);
      return {
        ...p,
        fullName: u?.fullName || 'Unknown Parent',
        email: u?.email || '',
        registrationNo: u?.registrationNo || '',
        phone: u?.phone
      };
    });
  }

  public queryClasses(): ClassSection[] {
    return this.data.classes.map(c => {
      const count = this.data.students.filter(s => s.classId === c.id).length;
      return {
        ...c,
        studentCount: count
      };
    });
  }

  public querySubjects(): Subject[] {
    return this.data.subjects;
  }

  public queryAttendance(filters?: { classId?: string; date?: string; studentId?: string; session?: 'morning' | 'afternoon' }): AttendanceRecord[] {
    let result = this.data.attendance;
    if (filters) {
      if (filters.classId) {
        result = result.filter(a => a.classId === filters.classId);
      }
      if (filters.date) {
        result = result.filter(a => a.date === filters.date);
      }
      if (filters.studentId) {
        result = result.filter(a => a.studentId === filters.studentId);
      }
      if (filters.session) {
        result = result.filter(a => a.session === filters.session);
      }
    }
    return result;
  }

  public queryAssessments(filters?: { studentId?: string; subjectId?: string }): AssessmentRecord[] {
    let result = this.data.assessments;
    if (filters) {
      if (filters.studentId) {
        result = result.filter(a => a.studentId === filters.studentId);
      }
      if (filters.subjectId) {
        result = result.filter(a => a.subjectId === filters.subjectId);
      }
    }
    return result;
  }

  // --- MUTATION APIS mimicking MySQL inserts, updates ---

  public insertUser(user: Omit<User, 'id' | 'createdAt' | 'status'>, plainPassword: string): User {
    const id = 'u-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      ...user,
      id,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    this.data.users.push(newUser);
    
    const salt = bcrypt.genSaltSync(10);
    this.data.passwords[id] = bcrypt.hashSync(plainPassword, salt);
    
    this.save();
    return newUser;
  }

  public insertStudentProfile(student: Omit<StudentProfile, 'id'>): StudentProfile {
    const id = 'sp-' + Math.random().toString(36).substr(2, 9);
    const newProfile: StudentProfile = {
      ...student,
      id
    };
    this.data.students.push(newProfile);
    this.save();
    return newProfile;
  }

  public insertTeacherProfile(teacher: Omit<TeacherProfile, 'id'>): TeacherProfile {
    const id = 'tp-' + Math.random().toString(36).substr(2, 9);
    const newProfile: TeacherProfile = {
      ...teacher,
      id
    };
    this.data.teachers.push(newProfile);
    this.save();
    return newProfile;
  }

  public insertParentProfile(parent: Omit<ParentProfile, 'id'>): ParentProfile {
    const id = 'pp-' + Math.random().toString(36).substr(2, 9);
    const newProfile: ParentProfile = {
      ...parent,
      id
    };
    this.data.parents.push(newProfile);
    this.save();
    return newProfile;
  }

  public logAttendance(attendance: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    // Check if an entry already exists for this student, class, date, and session
    const existingIndex = this.data.attendance.findIndex(
      a => a.studentId === attendance.studentId && 
           a.classId === attendance.classId && 
           a.date === attendance.date &&
           a.session === attendance.session
    );

    const record: AttendanceRecord = {
      ...attendance,
      id: existingIndex !== -1 ? this.data.attendance[existingIndex].id : 'att-' + Math.random().toString(36).substr(2, 9)
    };

    if (existingIndex !== -1) {
      this.data.attendance[existingIndex] = record;
    } else {
      this.data.attendance.push(record);
    }

    this.save();
    return record;
  }

  public insertAssessment(assessment: Omit<AssessmentRecord, 'id' | 'date'>): AssessmentRecord {
    const id = 'as-' + Math.random().toString(36).substr(2, 9);
    const newRecord: AssessmentRecord = {
      ...assessment,
      id,
      date: new Date().toISOString().split('T')[0]
    };
    this.data.assessments.push(newRecord);
    this.save();
    return newRecord;
  }

  // --- Student operations for Student Management Module ---
  public updateStudent(userId: string, updateData: {
    fullName: string;
    email: string;
    phone?: string;
    dob: string;
    gender: 'Male' | 'Female';
    classId?: string;
    parentId?: string;
    enrollmentDate?: string;
  }): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;

    // Update user table fields
    user.fullName = updateData.fullName;
    user.email = updateData.email;
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }

    // Update student profile table fields
    const student = this.data.students.find(s => s.userId === userId);
    if (student) {
      student.dob = updateData.dob;
      student.gender = updateData.gender;
      if (updateData.classId !== undefined) student.classId = updateData.classId;
      if (updateData.parentId !== undefined) student.parentId = updateData.parentId;
      if (updateData.enrollmentDate !== undefined) student.enrollmentDate = updateData.enrollmentDate;
    }

    this.save();
    return true;
  }

  public deleteStudent(userId: string): boolean {
    const initialUsersLength = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);
    delete this.data.passwords[userId];
    
    this.data.students = this.data.students.filter(s => s.userId !== userId);
    this.data.attendance = this.data.attendance.filter(a => a.studentId !== userId);
    this.data.assessments = this.data.assessments.filter(a => a.studentId !== userId);
    if (this.data.conduct) {
      this.data.conduct = this.data.conduct.filter(c => c.studentId !== userId);
    }
    
    this.save();
    return this.data.users.length < initialUsersLength;
  }

  // --- Teacher operations for Teacher Management Module ---
  public updateTeacher(userId: string, updateData: {
    fullName: string;
    email: string;
    phone?: string;
    specialization: string;
    hireDate: string;
    bio?: string;
    assignedGrade?: string;
    assignedSection?: string;
    assignedSubjects?: string[];
  }): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;

    // Update user table fields
    user.fullName = updateData.fullName;
    user.email = updateData.email;
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }

    // Update teacher profile table fields
    let teacher = this.data.teachers.find(t => t.userId === userId);
    if (!teacher) {
      const id = 'tp-' + Math.random().toString(36).substr(2, 9);
      teacher = {
        id,
        userId,
        specialization: updateData.specialization,
        hireDate: updateData.hireDate,
        bio: updateData.bio,
        assignedGrade: updateData.assignedGrade,
        assignedSection: updateData.assignedSection,
        assignedSubjects: updateData.assignedSubjects
      };
      this.data.teachers.push(teacher);
    } else {
      teacher.specialization = updateData.specialization;
      teacher.hireDate = updateData.hireDate;
      teacher.bio = updateData.bio;
      teacher.assignedGrade = updateData.assignedGrade;
      teacher.assignedSection = updateData.assignedSection;
      teacher.assignedSubjects = updateData.assignedSubjects;
    }

    this.save();
    return true;
  }

  public deleteTeacher(userId: string): boolean {
    const initialUsersLength = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);
    delete this.data.passwords[userId];
    
    this.data.teachers = this.data.teachers.filter(t => t.userId !== userId);
    
    // Clean up class and subjects assignment
    this.data.classes.forEach(c => {
      if (c.tutorId === userId) {
        c.tutorId = undefined;
      }
    });

    this.data.subjects.forEach(s => {
      if (s.teacherId === userId) {
        s.teacherId = undefined;
      }
    });

    this.save();
    return this.data.users.length < initialUsersLength;
  }

  public insertParentOnTheFly(parentData: { fullName: string; phone: string; address: string; occupation?: string }): string {
    const parentEmail = `parent-${Math.random().toString(36).substr(2, 5)}@bya.edu`;
    const regNo = `BYA-PRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const userObj = this.insertUser({
      email: parentEmail,
      fullName: parentData.fullName,
      phone: parentData.phone,
      role: 'parent',
      registrationNo: regNo
    }, 'parent123');

    this.insertParentProfile({
      userId: userObj.id,
      occupation: parentData.occupation || 'Self-Employed',
      address: parentData.address
    });

    return userObj.id; // Return the user id of the parent
  }

  // --- New Query & Mutation Helpers for Admin & Academic Modules ---

  public queryConduct(): ConductRecord[] {
    return this.data.conduct || [];
  }

  public insertConduct(record: Omit<ConductRecord, 'id'>): ConductRecord {
    const id = 'cnd-' + Math.random().toString(36).substr(2, 9);
    const newRecord: ConductRecord = {
      ...record,
      id
    };
    if (!this.data.conduct) this.data.conduct = [];
    this.data.conduct.push(newRecord);
    this.save();
    return newRecord;
  }

  public queryAnnouncements(): Announcement[] {
    return this.data.announcements || [];
  }

  public insertAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const id = 'ann-' + Math.random().toString(36).substr(2, 9);
    const newAnn: Announcement = {
      ...announcement,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    if (!this.data.announcements) this.data.announcements = [];
    this.data.announcements.push(newAnn);
    this.save();
    return newAnn;
  }

  public deleteAnnouncement(id: string): boolean {
    if (!this.data.announcements) return false;
    const initialLength = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter(a => a.id !== id);
    this.save();
    return this.data.announcements.length < initialLength;
  }

  public queryTimetables(): TimetableEntry[] {
    return this.data.timetables || [];
  }

  public insertTimetable(entry: Omit<TimetableEntry, 'id'>): TimetableEntry {
    const id = 'tt-' + Math.random().toString(36).substr(2, 9);
    const newEntry: TimetableEntry = {
      ...entry,
      id
    };
    if (!this.data.timetables) this.data.timetables = [];
    this.data.timetables.push(newEntry);
    this.save();
    return newEntry;
  }

  public deleteTimetable(id: string): boolean {
    if (!this.data.timetables) return false;
    const initialLength = this.data.timetables.length;
    this.data.timetables = this.data.timetables.filter(item => item.id !== id);
    this.save();
    return this.data.timetables.length < initialLength;
  }

  public queryGradeApprovals(): GradeApproval[] {
    return this.data.gradeApprovals || [];
  }

  public insertGradeApproval(approval: Omit<GradeApproval, 'id' | 'createdAt' | 'status'>): GradeApproval {
    const id = 'gap-' + Math.random().toString(36).substr(2, 9);
    const newApproval: GradeApproval = {
      ...approval,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    if (!this.data.gradeApprovals) this.data.gradeApprovals = [];
    this.data.gradeApprovals.push(newApproval);
    this.save();
    return newApproval;
  }

  public updateGradeApprovalStatus(id: string, status: 'Approved' | 'Rejected'): boolean {
    if (!this.data.gradeApprovals) return false;
    const approval = this.data.gradeApprovals.find(g => g.id === id);
    if (approval) {
      approval.status = status;
      // Synthesize assessment insertion if approved
      if (status === 'Approved') {
        const assessmentIndex = this.data.assessments.findIndex(a => a.id === approval.assessmentId);
        if (assessmentIndex === -1) {
          // Resolve student profile & tutor info
          const studentProfile = approval.studentId ? this.data.students.find(s => s.userId === approval.studentId) : this.data.students.find(s => {
            const u = this.data.users.find(usr => usr.id === s.userId);
            return u?.fullName === approval.studentName;
          });
          const subjectObj = approval.subjectId ? this.data.subjects.find(sub => sub.id === approval.subjectId) : this.data.subjects.find(sub => sub.subjectName === approval.subjectName);
          const resolvedClassId = approval.classId || studentProfile?.classId || 'c-01';
          
          this.insertAssessment({
            studentId: approval.studentId || studentProfile?.userId || 'u-student-01',
            studentName: approval.studentName,
            subjectId: approval.subjectId || subjectObj?.id || 's-01',
            subjectName: approval.subjectName,
            marksObtained: approval.marksObtained,
            maxMarks: approval.maxMarks,
            grade: approval.grade,
            term: (approval.quarter && ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'].includes(approval.quarter)) ? undefined : 'Term 1',
            quarter: approval.quarter || 'Quarter 1',
            classId: resolvedClassId,
            status: 'Approved',
            remarks: approval.remarks || 'Approved by Administrator Panel'
          });
        }
      }
      this.save();
      return true;
    }
    return false;
  }

  public updateAssessment(id: string, updateData: Partial<AssessmentRecord>): boolean {
    const recordIndex = this.data.assessments.findIndex(a => a.id === id);
    if (recordIndex !== -1) {
      this.data.assessments[recordIndex] = {
        ...this.data.assessments[recordIndex],
        ...updateData
      };
      this.save();
      return true;
    }
    return false;
  }

  public deleteAssessment(id: string): boolean {
    const initialLength = this.data.assessments.length;
    this.data.assessments = this.data.assessments.filter(a => a.id !== id);
    this.save();
    return this.data.assessments.length < initialLength;
  }
}

// Singleton database connection instance
export const db = new DBConnection();
