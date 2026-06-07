import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { UserRole } from './src/types';
import authRouter from './server/routes/auth.routes';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bya-2026-key';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log requests for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Middleware to authenticate JWT token
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token is required.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired session token.' });
      }
      req.user = decoded;
      next();
    });
  };

  app.use('/api/auth', authRouter as any);

  // Get high-level system metrics
  app.get('/api/stats', authenticateToken, (req, res) => {
    const students = db.queryStudents();
    const teachers = db.queryTeachers();
    const classes = db.queryClasses();
    const subjects = db.querySubjects();
    const attendance = db.queryAttendance();

    // Calculate dynamic attendance rate for today
    const totalAttendanceLogs = attendance.length;
    const presents = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = totalAttendanceLogs > 0 ? Math.round((presents / totalAttendanceLogs) * 100) : 95;

    res.json({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      attendanceRate
    });
  });

  // Get and search students
  app.get('/api/students', authenticateToken, (req, res) => {
    let allStudents = db.queryStudents();
    
    // Server-side filtering & searching
    const search = (req.query.search as string || '').toLowerCase().trim();
    const grade = (req.query.grade as string || '').trim();
    const section = (req.query.section as string || '').trim();

    if (search) {
      allStudents = allStudents.filter(s => 
        s.fullName.toLowerCase().includes(search) || 
        s.registrationNo.toLowerCase().includes(search) ||
        (s.parentName && s.parentName.toLowerCase().includes(search)) ||
        (s.parentPhone && s.parentPhone.includes(search))
      );
    }

    if (grade) {
      allStudents = allStudents.filter(s => s.className && s.className.toLowerCase().includes(grade.toLowerCase()));
    }

    if (section) {
      allStudents = allStudents.filter(s => s.className && s.className.toLowerCase().endsWith(`-${section.toLowerCase()}`));
    }

    // Server-side paging
    const page = parseInt(req.query.page as string || '0');
    const limit = parseInt(req.query.limit as string || '0');

    if (page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedList = allStudents.slice(startIndex, endIndex);
      
      return res.json({
        students: paginatedList,
        totalCount: allStudents.length,
        totalPages: Math.ceil(allStudents.length / limit),
        page,
        limit
      });
    }

    res.json(allStudents);
  });

  // Get specific student profile info
  app.get('/api/students/:id', authenticateToken, (req, res) => {
    const students = db.queryStudents();
    const student = students.find(s => s.userId === req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Load detailed profile sections
    const dbAttendance = db.queryAttendance({ studentId: req.params.id });
    const dbGrades = db.queryAssessments({ studentId: req.params.id });
    const dbConduct = db.queryConduct().filter(c => c.studentId === req.params.id);

    res.json({
      ...student,
      attendance: dbAttendance,
      grades: dbGrades,
      conduct: dbConduct
    });
  });

  app.post('/api/students', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }

    const { 
      email, 
      password, 
      fullName, 
      phone, 
      dob, 
      gender, 
      classId, 
      parentId,
      createParent,
      parentName,
      parentPhone,
      parentAddress,
      parentOccupation,
      admissionDate
    } = req.body;

    if (!email || !fullName || !dob || !gender) {
      return res.status(400).json({ error: 'Required fields: email, fullName, dob, gender' });
    }

    try {
      let finalParentId = parentId;
      if (createParent && parentName) {
        finalParentId = db.insertParentOnTheFly({
          fullName: parentName,
          phone: parentPhone || '',
          address: parentAddress || 'BYA Campus Area, Addis Ababa',
          occupation: parentOccupation || ''
        });
      }

      // Create new user account mapping
      const regNo = `BYA-STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const userObj = db.insertUser({
        email,
        fullName,
        phone: phone || '',
        role: 'student',
        registrationNo: regNo
      }, password || 'student123');

      // Create student profile record
      const studentProfile = db.insertStudentProfile({
        userId: userObj.id,
        parentId: finalParentId || undefined,
        classId: classId || undefined,
        dob,
        gender,
        enrollmentDate: admissionDate || new Date().toISOString().split('T')[0]
      });

      res.status(201).json({
        message: 'Student registered successfully',
        student: {
          ...studentProfile,
          fullName: userObj.fullName,
          email: userObj.email,
          registrationNo: userObj.registrationNo
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error compiling registration.' });
    }
  });

  app.put('/api/students/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }

    const { 
      fullName, 
      email, 
      phone, 
      dob, 
      gender, 
      classId, 
      parentId,
      createParent,
      parentName,
      parentPhone,
      parentAddress,
      parentOccupation,
      admissionDate
    } = req.body;

    if (!fullName || !email || !dob || !gender) {
      return res.status(400).json({ error: 'Required fields: fullName, email, dob, gender' });
    }

    try {
      let finalParentId = parentId;
      if (createParent && parentName) {
        finalParentId = db.insertParentOnTheFly({
          fullName: parentName,
          phone: parentPhone || '',
          address: parentAddress || 'BYA Campus Area, Addis Ababa',
          occupation: parentOccupation || ''
        });
      }

      const success = db.updateStudent(req.params.id, {
        fullName,
        email,
        phone,
        dob,
        gender,
        classId,
        parentId: finalParentId,
        enrollmentDate: admissionDate
      });

      if (success) {
        res.json({ message: 'Student profile updated successfully.' });
      } else {
        res.status(404).json({ error: 'Student not found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error updating student record.' });
    }
  });

  app.delete('/api/students/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators are authorized to delete student accounts.' });
    }

    try {
      const success = db.deleteStudent(req.params.id);
      if (success) {
        res.json({ message: 'Student and linked profile records deleted successfully.' });
      } else {
        res.status(404).json({ error: 'Student not found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting student.' });
    }
  });

  // Teachers endpoints
  app.get('/api/teachers', authenticateToken, (req, res) => {
    res.json(db.queryTeachers());
  });

  app.post('/api/teachers', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action restricted to administrators.' });
    }

    const {
      fullName,
      email,
      password,
      phone,
      specialization,
      hireDate,
      bio,
      assignedGrade,
      assignedSection,
      assignedSubjects
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Required fields: fullName, email' });
    }

    try {
      // Create user record for teacher
      const regNo = `BYA-TCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const userObj = db.insertUser({
        email,
        fullName,
        phone: phone || '',
        role: 'teacher',
        registrationNo: regNo
      }, password || 'teacher123');

      // Create teacher profile
      const teacherProfile = db.insertTeacherProfile({
        userId: userObj.id,
        specialization: specialization || 'General',
        hireDate: hireDate || new Date().toISOString().split('T')[0],
        bio: bio || '',
        assignedGrade: assignedGrade || '',
        assignedSection: assignedSection || '',
        assignedSubjects: assignedSubjects || []
      });

      res.status(201).json({
        message: 'Teacher registered successfully',
        teacher: {
          ...teacherProfile,
          fullName: userObj.fullName,
          email: userObj.email,
          registrationNo: userObj.registrationNo,
          phone: userObj.phone
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error registering teacher.' });
    }
  });

  app.put('/api/teachers/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action restricted to administrators.' });
    }

    const {
      fullName,
      email,
      phone,
      specialization,
      hireDate,
      bio,
      assignedGrade,
      assignedSection,
      assignedSubjects
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Required fields: fullName, email' });
    }

    try {
      const success = db.updateTeacher(req.params.id, {
        fullName,
        email,
        phone,
        specialization,
        hireDate: hireDate || new Date().toISOString().split('T')[0],
        bio: bio || '',
        assignedGrade,
        assignedSection,
        assignedSubjects
      });

      if (success) {
        res.json({ message: 'Teacher profile updated successfully.' });
      } else {
        res.status(404).json({ error: 'Teacher not found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error updating teacher.' });
    }
  });

  app.delete('/api/teachers/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action restricted to administrators.' });
    }

    try {
      const success = db.deleteTeacher(req.params.id);
      if (success) {
        res.json({ message: 'Teacher deleted successfully.' });
      } else {
        res.status(404).json({ error: 'Teacher not found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error deleting teacher.' });
    }
  });

  // Get generic catalog items
  app.get('/api/parents', authenticateToken, (req, res) => {
    res.json(db.queryParents());
  });

  app.get('/api/classes', authenticateToken, (req, res) => {
    res.json(db.queryClasses());
  });

  app.get('/api/subjects', authenticateToken, (req, res) => {
    res.json(db.querySubjects());
  });

  // Get and submit double-session attendance data
  app.get('/api/attendance', authenticateToken, (req, res) => {
    const { classId, date, session } = req.query;
    res.json(db.queryAttendance({ 
      classId: classId as string, 
      date: date as string,
      session: session as 'morning' | 'afternoon'
    }));
  });

  app.post('/api/attendance', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This role is unauthorized to log attendance.' });
    }

    const { studentId, studentName, classId, date, status, remarks, session } = req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({ error: 'Missing required parameters for attendance.' });
    }

    // Role check: Teachers can only mark attendance for their assigned classes
    if (req.user.role === 'teacher') {
      const targetClass = db.data.classes.find(c => c.id === classId);
      const teacherProfile = db.data.teachers.find(t => t.userId === req.user.id);
      
      const isTutor = targetClass?.tutorId === req.user.id;
      const isAssigned = targetClass && teacherProfile && 
        teacherProfile.assignedGrade === targetClass.className && 
        teacherProfile.assignedSection === targetClass.section;

      if (!isTutor && !isAssigned) {
        return res.status(403).json({ 
          error: `Authorization Error: You are only allowed to manage attendance for your assigned sections.` 
        });
      }
    }

    const record = db.logAttendance({
      studentId,
      studentName: studentName || 'Student',
      classId,
      date,
      session: session || 'morning',
      status,
      remarks: remarks || ''
    });

    res.json({ message: 'Attendance processed successfully', record });
  });

  // Get assessments/grades data for query
  app.get('/api/assessments', authenticateToken, (req: any, res) => {
    const { studentId, subjectId, quarter } = req.query;
    
    // For student/parent checks, they can only view self or child assessments
    if (req.user.role === 'student') {
      return res.json(db.queryAssessments({ studentId: req.user.id }));
    }

    if (req.user.role === 'parent') {
      const students = db.queryStudents();
      const firstChild = students.find(s => s.parentId === req.user.id);
      if (!firstChild) {
        return res.json([]);
      }
      return res.json(db.queryAssessments({ studentId: firstChild.userId }));
    }

    let records = db.queryAssessments({
      studentId: studentId as string,
      subjectId: subjectId as string
    });

    if (quarter) {
      records = records.filter((r: any) => r.quarter === quarter || r.term === quarter);
    }

    res.json(records);
  });

  app.post('/api/assessments', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Authorized educators only.' });
    }

    const { studentId, studentName, subjectId, subjectName, marksObtained, maxMarks, grade, term, quarter, classId, status, remarks } = req.body;

    if (!studentId || !subjectId || marksObtained === undefined || !grade) {
      return res.status(400).json({ error: 'Missing required grading details.' });
    }

    // Lookup classId if missing
    let resolvedClassId = classId;
    if (!resolvedClassId) {
      const st = db.queryStudents().find(s => s.userId === studentId);
      resolvedClassId = st?.classId || 'c-01';
    }

    const record = db.insertAssessment({
      studentId,
      studentName: studentName || 'Student',
      subjectId,
      subjectName: subjectName || 'Subject',
      marksObtained: Number(marksObtained),
      maxMarks: Number(maxMarks || 100),
      grade,
      term: term || undefined,
      quarter: quarter || 'Quarter 1',
      classId: resolvedClassId,
      status: status || 'Approved',
      remarks: remarks || ''
    });

    res.status(201).json({ message: 'Grade marks saved', record });
  });

  app.patch('/api/assessments/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Authorized educators only.' });
    }

    const success = db.updateAssessment(req.params.id, req.body);
    if (success) {
      res.json({ message: 'Grade marks updated successfully.' });
    } else {
      res.status(404).json({ error: 'Grade marks not found.' });
    }
  });

  app.delete('/api/assessments/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    const success = db.deleteAssessment(req.params.id);
    if (success) {
      res.json({ message: 'Grade marks deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Grade marks not found.' });
    }
  });

  // Fetch compiled report card statistics and class rank
  app.get('/api/report-card', authenticateToken, (req: any, res) => {
    const targetStudentId = req.query.studentId || req.user.id;
    const selectedQuarter = req.query.quarter || 'Quarter 1';

    // Access control: students and parents can only see their own / child's report
    if (req.user.role === 'student' && targetStudentId !== req.user.id) {
      return res.status(403).json({ error: 'Access restricted.' });
    }
    if (req.user.role === 'parent') {
      const children = db.queryStudents().filter(s => s.parentId === req.user.id);
      if (!children.some(c => c.userId === targetStudentId)) {
        return res.status(403).json({ error: 'Access to child profile only.' });
      }
    }

    const students = db.queryStudents();
    const studentObj = students.find(s => s.userId === targetStudentId);
    if (!studentObj) {
      return res.status(404).json({ error: 'Student registration not found.' });
    }

    const userObj = db.data.users.find(u => u.id === targetStudentId);
    const classes = db.queryClasses();
    const classSectionObj = classes.find(c => c.id === studentObj.classId);

    // Get all approved marks in the section for comparison/ranking
    const allAssessments = db.queryAssessments();
    const approvedSectionAssessments = allAssessments.filter(a => {
      const isCorrectPeriod = a.quarter === selectedQuarter || (selectedQuarter === 'Quarter 1' && a.term === 'Term 1') || (selectedQuarter === 'Quarter 2' && a.term === 'Term 2') || (selectedQuarter === 'Quarter 3' && a.term === 'Term 3');
      const studentProfile = students.find(s => s.userId === a.studentId);
      return isCorrectPeriod && studentProfile?.classId === studentObj.classId;
    });

    // Group scores by student
    const sectionStudentsGrades: Record<string, { totalObtained: number; totalMax: number; count: number }> = {};
    approvedSectionAssessments.forEach(a => {
      if (!sectionStudentsGrades[a.studentId]) {
        sectionStudentsGrades[a.studentId] = { totalObtained: 0, totalMax: 0, count: 0 };
      }
      sectionStudentsGrades[a.studentId].totalObtained += a.marksObtained;
      sectionStudentsGrades[a.studentId].totalMax += a.maxMarks;
      sectionStudentsGrades[a.studentId].count += 1;
    });

    // Sort student averages to find rank
    const sortedRoster = Object.keys(sectionStudentsGrades).map(stId => {
      const g = sectionStudentsGrades[stId];
      const avgPct = g.totalMax > 0 ? (g.totalObtained / g.totalMax) * 100 : 0;
      return { studentId: stId, avgPct };
    }).sort((a, b) => b.avgPct - a.avgPct);

    // Find student's placing
    let targetRank = -1;
    if (sortedRoster.length > 0) {
      let currentRank = 1;
      for (let i = 0; i < sortedRoster.length; i++) {
        if (i > 0 && sortedRoster[i].avgPct < sortedRoster[i - 1].avgPct) {
          currentRank = i + 1;
        }
        if (sortedRoster[i].studentId === targetStudentId) {
          targetRank = currentRank;
          break;
        }
      }
    }

    // Accumulate total scores for this student
    const studentGrades = approvedSectionAssessments.filter(a => a.studentId === targetStudentId);
    let totalObtained = 0;
    let totalMax = 0;
    studentGrades.forEach(g => {
      totalObtained += g.marksObtained;
      totalMax += g.maxMarks;
    });

    const averagePct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const passStatus = totalMax > 0 ? (averagePct >= 50 ? 'Pass' : 'Fail') : 'No Grades';

    // Get latest conduct logs
    const conductLogs = db.queryConduct().filter(c => c.studentId === targetStudentId);
    let conductGrade = 'Excellent';
    let conductComment = '';
    if (conductLogs.length > 0) {
      conductLogs.sort((a, b) => b.incidentDate.localeCompare(a.incidentDate));
      conductGrade = conductLogs[0].conductScore; // Latest conduct score
      conductComment = conductLogs[0].description; // Latest conduct logs details
    }

    // Get attendance rate
    const attendanceLogs = db.queryAttendance({ studentId: targetStudentId });
    const totalDays = attendanceLogs.length;
    const presentDays = attendanceLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Check if there are outstanding grades key entries
    const pendingApprovalsCount = db.queryGradeApprovals().filter(g => {
      const isCorrectQuarter = g.quarter === selectedQuarter || (!g.quarter && selectedQuarter === 'Quarter 1');
      return g.studentName === userObj?.fullName && isCorrectQuarter && g.status === 'Pending';
    }).length;

    res.json({
      studentId: targetStudentId,
      studentName: userObj?.fullName || 'Student',
      registrationNo: userObj?.registrationNo || 'No Registration',
      className: classSectionObj?.className || 'Grade Level',
      section: classSectionObj?.section || 'Section Unit',
      quarter: selectedQuarter,
      grades: studentGrades,
      totalObtained,
      totalMax,
      average: averagePct,
      rank: targetRank !== -1 ? targetRank : undefined,
      totalStudents: sortedRoster.length > 0 ? sortedRoster.length : 1,
      passStatus,
      conductGrade,
      conductComment,
      attendanceSummary: {
        totalDays,
        presentDays,
        attendanceRate
      },
      approvalStatus: pendingApprovalsCount > 0 ? 'Pending Admin Review' : 'Approved'
    });
  });

  // Student Conduct Tracker
  app.get('/api/conduct', authenticateToken, (req, res) => {
    res.json(db.queryConduct());
  });

  app.post('/api/conduct', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }
    const { studentId, studentName, incidentDate, conductScore, description, reportedBy } = req.body;
    if (!studentId || !studentName || !incidentDate || !conductScore || !description) {
      return res.status(400).json({ error: 'Missing required parameters for conduct incident.' });
    }

    // Role check: Teachers can only log conduct for their classes
    if (req.user.role === 'teacher') {
      const teacherProfile = db.data.teachers.find(t => t.userId === req.user.id);
      if (!teacherProfile) {
        return res.status(403).json({ error: 'Teacher profile not found.' });
      }
      const studentObj = db.data.students.find(s => s.userId === studentId);
      if (!studentObj) {
        return res.status(404).json({ error: 'Student profile not found.' });
      }
      const classes = db.queryClasses();
      const studentClass = classes.find(c => c.id === studentObj.classId);
      
      const isAssigned = studentClass && 
        teacherProfile.assignedGrade === studentClass.className && 
        teacherProfile.assignedSection === studentClass.section;
        
      if (!isAssigned) {
        return res.status(403).json({ error: `You are only authorized to log conduct logs for students in your assigned section (${teacherProfile.assignedGrade || 'N/A'} ${teacherProfile.assignedSection || 'N/A'}).` });
      }
    }

    const record = db.insertConduct({
      studentId,
      studentName,
      incidentDate,
      conductScore,
      description,
      reportedBy: reportedBy || req.user.fullName
    });
    res.status(201).json({ message: 'Conduct incident saved', record });
  });

  app.put('/api/conduct/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }
    const conductId = req.params.id;
    const { conductScore, description, incidentDate, reportedBy } = req.body;

    const conductRecord = db.data.conduct.find(c => c.id === conductId);
    if (!conductRecord) {
      return res.status(404).json({ error: 'Conduct record not found.' });
    }

    // Role check: Teachers can only edit conduct for their classes
    if (req.user.role === 'teacher') {
      const teacherProfile = db.data.teachers.find(t => t.userId === req.user.id);
      if (!teacherProfile) {
        return res.status(403).json({ error: 'Teacher profile not found.' });
      }
      const studentObj = db.data.students.find(s => s.userId === conductRecord.studentId);
      if (!studentObj) {
        return res.status(404).json({ error: 'Associated student profile not found.' });
      }
      const classes = db.queryClasses();
      const studentClass = classes.find(c => c.id === studentObj.classId);
      
      const isAssigned = studentClass && 
        teacherProfile.assignedGrade === studentClass.className && 
        teacherProfile.assignedSection === studentClass.section;
        
      if (!isAssigned) {
        return res.status(403).json({ error: `You are only authorized to edit conduct logs for students in your assigned section (${teacherProfile.assignedGrade || 'N/A'} ${teacherProfile.assignedSection || 'N/A'}).` });
      }
    }

    if (conductScore) conductRecord.conductScore = conductScore;
    if (description) conductRecord.description = description;
    if (incidentDate) conductRecord.incidentDate = incidentDate;
    if (reportedBy) conductRecord.reportedBy = reportedBy;

    db.save();
    res.json({ message: 'Conduct record updated successfully', record: conductRecord });
  });

  app.delete('/api/conduct/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }
    const conductId = req.params.id;
    const conductIndex = db.data.conduct.findIndex(c => c.id === conductId);
    if (conductIndex === -1) {
      return res.status(404).json({ error: 'Conduct record not found.' });
    }
    const conductRecord = db.data.conduct[conductIndex];

    // Role check: Teachers can only delete conduct for their classes
    if (req.user.role === 'teacher') {
      const teacherProfile = db.data.teachers.find(t => t.userId === req.user.id);
      if (!teacherProfile) {
        return res.status(403).json({ error: 'Teacher profile not found.' });
      }
      const studentObj = db.data.students.find(s => s.userId === conductRecord.studentId);
      if (!studentObj) {
        return res.status(404).json({ error: 'Associated student profile not found.' });
      }
      const classes = db.queryClasses();
      const studentClass = classes.find(c => c.id === studentObj.classId);
      
      const isAssigned = studentClass && 
        teacherProfile.assignedGrade === studentClass.className && 
        teacherProfile.assignedSection === studentClass.section;
        
      if (!isAssigned) {
        return res.status(403).json({ error: `You are only authorized to delete conduct logs for students in your assigned section (${teacherProfile.assignedGrade || 'N/A'} ${teacherProfile.assignedSection || 'N/A'}).` });
      }
    }

    db.data.conduct.splice(conductIndex, 1);
    db.save();
    res.json({ message: 'Conduct record deleted successfully' });
  });

  // School Announcements
  app.get('/api/announcements', authenticateToken, (req, res) => {
    res.json(db.queryAnnouncements());
  });

  app.post('/api/announcements', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action restricted to teachers/admins.' });
    }
    const { title, content, targetAudience, status } = req.body;
    if (!title || !content || !targetAudience) {
      return res.status(400).json({ error: 'Missing required title, content or targetAudience.' });
    }
    const ann = db.insertAnnouncement({
      title,
      content,
      targetAudience,
      status: status || 'Published',
      postedBy: `${req.user.fullName} (${req.user.role === 'admin' ? 'Admin' : 'Tutor'})`
    });
    res.status(201).json({ message: 'Announcement created', announcement: ann });
  });

  app.put('/api/announcements/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Action restricted to teachers/admins.' });
    }
    const annId = req.params.id;
    const { title, content, targetAudience, status } = req.body;

    const ann = db.data.announcements.find(a => a.id === annId);
    if (!ann) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    if (title !== undefined) ann.title = title;
    if (content !== undefined) ann.content = content;
    if (targetAudience !== undefined) ann.targetAudience = targetAudience;
    if (status !== undefined) ann.status = status;

    db.save();
    res.json({ message: 'Announcement updated successfully.', announcement: ann });
  });

  app.delete('/api/announcements/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete announcements.' });
    }
    const success = db.deleteAnnouncement(req.params.id);
    if (success) {
      res.json({ message: 'Announcement deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Announcement not found.' });
    }
  });

  // Helper to parse time string like "08:30 AM" or "13:00" to minutes from midnight
  function parseTimeToMinutes(timeStr: string): number {
    const normalized = timeStr.trim().toUpperCase();
    const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3];
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    }
    
    const simpleMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (simpleMatch) {
      const hours = parseInt(simpleMatch[1], 10);
      const minutes = parseInt(simpleMatch[2], 10);
      return hours * 60 + minutes;
    }
    return 0;
  }

  // Timetables Scheduling
  app.get('/api/timetables', authenticateToken, (req, res) => {
    res.json(db.queryTimetables());
  });

  app.post('/api/timetables', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can structure timetables.' });
    }
    const { classId, className, subjectName, dayOfWeek, startTime, endTime, teacherName, roomNo } = req.body;
    if (!classId || !className || !subjectName || !dayOfWeek || !startTime || !endTime || !teacherName || !roomNo) {
      return res.status(400).json({ error: 'Missing class, day, time or tutor parameters for scheduler.' });
    }

    // Shift interval validation
    const s1 = parseTimeToMinutes(startTime);
    const e1 = parseTimeToMinutes(endTime);
    if (e1 <= s1) {
      return res.status(400).json({ error: 'End time must be after the start time.' });
    }

    const allEntries = db.queryTimetables();
    for (const entry of allEntries) {
      if (entry.dayOfWeek !== dayOfWeek) continue;
      const s2 = parseTimeToMinutes(entry.startTime);
      const e2 = parseTimeToMinutes(entry.endTime);
      const isOverlapping = s1 < e2 && e1 > s2;

      if (isOverlapping) {
        if (entry.roomNo && entry.roomNo.trim().toLowerCase() === roomNo.trim().toLowerCase()) {
          return res.status(409).json({
            error: `Room Clash: Room ${entry.roomNo} is already occupied on ${dayOfWeek} from ${entry.startTime} to ${entry.endTime} by ${entry.className} (${entry.subjectName}).`
          });
        }
        if (entry.teacherName && entry.teacherName.trim().toLowerCase() === teacherName.trim().toLowerCase()) {
          return res.status(409).json({
            error: `Teacher Clash: Instructor ${entry.teacherName} is already scheduled to teach ${entry.className} (${entry.subjectName}) on ${dayOfWeek} from ${entry.startTime} to ${entry.endTime}.`
          });
        }
        if (entry.classId === classId) {
          return res.status(409).json({
            error: `Class Clash: Section ${entry.className} is already scheduled for ${entry.subjectName} on ${dayOfWeek} from ${entry.startTime} to ${entry.endTime}.`
          });
        }
      }
    }

    const entry = db.insertTimetable({
      classId,
      className,
      subjectName,
      dayOfWeek,
      startTime,
      endTime,
      teacherName,
      roomNo
    });
    res.status(201).json({ message: 'Timetable entry added', entry });
  });

  app.put('/api/timetables/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can edit timetables.' });
    }
    const timetableId = req.params.id;
    const { classId, className, subjectName, dayOfWeek, startTime, endTime, teacherName, roomNo } = req.body;

    const entryToEdit = db.data.timetables.find(t => t.id === timetableId);
    if (!entryToEdit) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }

    const nextClassId = classId || entryToEdit.classId;
    const nextClassName = className || entryToEdit.className;
    const nextSubjectName = subjectName || entryToEdit.subjectName;
    const nextDayOfWeek = dayOfWeek || entryToEdit.dayOfWeek;
    const nextStartTime = startTime || entryToEdit.startTime;
    const nextEndTime = endTime || entryToEdit.endTime;
    const nextTeacherName = teacherName || entryToEdit.teacherName;
    const nextRoomNo = roomNo || entryToEdit.roomNo;

    // Validate times
    const s1 = parseTimeToMinutes(nextStartTime);
    const e1 = parseTimeToMinutes(nextEndTime);
    if (e1 <= s1) {
      return res.status(400).json({ error: 'End time must be after the start time.' });
    }

    // Overlap checks
    const allEntries = db.queryTimetables();
    for (const entry of allEntries) {
      if (entry.id === timetableId) continue;
      if (entry.dayOfWeek !== nextDayOfWeek) continue;
      const s2 = parseTimeToMinutes(entry.startTime);
      const e2 = parseTimeToMinutes(entry.endTime);
      const isOverlapping = s1 < e2 && e1 > s2;

      if (isOverlapping) {
        if (entry.roomNo && entry.roomNo.trim().toLowerCase() === nextRoomNo.trim().toLowerCase()) {
          return res.status(409).json({
            error: `Room Clash: Room ${entry.roomNo} is already occupied on ${nextDayOfWeek} from ${entry.startTime} to ${entry.endTime} by ${entry.className} (${entry.subjectName}).`
          });
        }
        if (entry.teacherName && entry.teacherName.trim().toLowerCase() === nextTeacherName.trim().toLowerCase()) {
          return res.status(409).json({
            error: `Teacher Clash: Instructor ${entry.teacherName} is already scheduled to teach ${entry.className} (${entry.subjectName}) on ${nextDayOfWeek} from ${entry.startTime} to ${entry.endTime}.`
          });
        }
        if (entry.classId === nextClassId) {
          return res.status(409).json({
            error: `Class Clash: Section ${entry.className} is already scheduled for ${entry.subjectName} on ${nextDayOfWeek} from ${entry.startTime} to ${entry.endTime}.`
          });
        }
      }
    }

    if (classId) entryToEdit.classId = classId;
    if (className) entryToEdit.className = className;
    if (subjectName) entryToEdit.subjectName = subjectName;
    if (dayOfWeek) entryToEdit.dayOfWeek = dayOfWeek;
    if (startTime) entryToEdit.startTime = startTime;
    if (endTime) entryToEdit.endTime = endTime;
    if (teacherName) entryToEdit.teacherName = teacherName;
    if (roomNo) entryToEdit.roomNo = roomNo;

    db.save();
    res.json({ message: 'Timetable entry modified successfully', record: entryToEdit });
  });

  app.delete('/api/timetables/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action unauthorized.' });
    }
    const success = db.deleteTimetable(req.params.id);
    if (success) {
      res.json({ message: 'Timetable schedule cleared.' });
    } else {
      res.status(404).json({ error: 'Entry not found.' });
    }
  });

  // Grade Approvals Workflow
  app.get('/api/grade-approvals', authenticateToken, (req, res) => {
    res.json(db.queryGradeApprovals());
  });

  app.post('/api/grade-approvals', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only instructors submit grade approvals.' });
    }
    const { assessmentId, studentId, studentName, classId, subjectId, subjectName, marksObtained, maxMarks, grade, quarter, remarks, submittedBy } = req.body;
    if (!studentName || !subjectName || marksObtained === undefined || !grade) {
      return res.status(400).json({ error: 'Missing fields for grade entry approval submission.' });
    }
    const approval = db.insertGradeApproval({
      assessmentId: assessmentId || `as-gen-${Math.floor(Math.random() * 99999)}`,
      studentId,
      studentName,
      classId,
      subjectId,
      subjectName,
      marksObtained: Number(marksObtained),
      maxMarks: Number(maxMarks || 100),
      grade,
      quarter: quarter || 'Quarter 1',
      remarks: remarks || '',
      submittedBy: submittedBy || req.user.fullName
    });
    res.status(201).json({ message: 'Grade submission saved and currently pending approval from administration deck.', approval });
  });

  app.patch('/api/grade-approvals/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action restricted to school administration.' });
    }
    const { status } = req.body;
    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }
    const success = db.updateGradeApprovalStatus(req.params.id, status);
    if (success) {
      res.json({ message: `Grade status successfully updated to ${status}.` });
    } else {
      res.status(404).json({ error: 'Grade approval record not found.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bethelhem Youth Academy Server active on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
  });
}

startServer();
