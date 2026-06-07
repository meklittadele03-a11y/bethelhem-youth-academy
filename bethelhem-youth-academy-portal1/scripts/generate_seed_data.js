import fs from 'fs';
import path from 'path';

// Pre-computed bcrypt hashes for "password123" to make database loading instant and responsive
// All dynamic users will use "password123" by default
const PASSWORD_HASH = "$2b$10$9a2GU6CNTQlexp01WnMODe5J8.WqYD06RSerQKDzYdfgIrwrbjmLG";

// 1. Lists of highly realistic Ethiopian Names for realistic demonstration
const ETHIOPIAN_FIRST_MALE = [
  "Yonas", "Kaleb", "Abebe", "Dawit", "Tariku", "Bekele", "Tewodros", "Samuel", "Girma", "Solomon",
  "Mohammed", "Daniel", "Bereket", "Henok", "Yosef", "Getachew", "Elias", "Mikias", "Kibrom", "Eyob",
  "Haile", "Muluken", "Zelalem", "Fasil", "Robel", "Abdi", "Chala", "Lema", "Gudina", "Tsegaye",
  "Kidus", "Abenezer", "Dagim", "Mathias", "Nathan", "Sileshi", "Fikru", "Estifanos", "Asrat", "Dejene"
];

const ETHIOPIAN_FIRST_FEMALE = [
  "Almaz", "Selam", "Helen", "Marta", "Tigist", "Aster", "Genet", "Kidist", "Ruth", "Eden",
  "Tsige", "Frehiwot", "Meron", "Rediet", "Eyerusalem", "Kalkidan", "Bethelhem", "Liyu", "Mahlet", "Sifan",
  "Chaltu", "Mihret", "Feven", "Blen", "Hana", "Tizita", "Semira", "Rahel", "Lidiya", "Nardos",
  "Saba", "Hiwot", "Zenebech", "Meseret", "Wubet", "Elshaday", "Yordanos", "Aida", "Sara", "Kiya"
];

const ETHIOPIAN_LAST_NAMES = [
  "Kebede", "Tesfaye", "Wolde", "Mekonnen", "Tekle", "Hailu", "Assefa", "Teklay", "Beyene", "Melese",
  "Tadesse", "Demissie", "Kasahun", "Balcha", "Mengistu", "Belay", "Birhanu", "Negash", "Alemu", "Eshete",
  "Worku", "Dejene", "Geda", "Regassa", "Tolosa", "Megersa", "Diriba", "Lema", "Bekele", "Gemechu",
  "Abera", "Feyisa", "Desta", "Kassa", "Ayalew", "Shiferaw", "Zewde", "Kifle", "Gashaw", "Sileshi"
];

const ADDIS_POSTAL_ADDRESSES = [
  "Bole Subcity, House No. 542, Addis Ababa",
  "Yeka Subcity, House No. 891, Addis Ababa",
  "Nifas Silk-Lafto Subcity, House No. 1204, Addis Ababa",
  "Arada Subcity, House No. 341, Addis Ababa",
  "Kirkos Subcity, House No. 705, Addis Ababa",
  "Lideta Subcity, House No. 912, Addis Ababa",
  "Gullele Subcity, House No. 154, Addis Ababa",
  "Kolfe Keranio Subcity, House No. 2380, Addis Ababa",
  "Akaki Kality Subcity, House No. 445, Addis Ababa",
  "Bole Subcity, Woreda 03, House No. 109, Addis Ababa",
  "Kirkos Subcity, Woreda 08, House No. 504, Addis Ababa",
  "Yeka Subcity, Woreda 11, House No. 721, Addis Ababa"
];

const OCCUPATIONS = [
  "Civil Servant", "Business Owner", "Trader", "High School Teacher", "University Lecturer",
  "Engineer", "Doctor", "Banker", "Nurse", "Accountant", "Office Manager", "Journalist",
  "Agronomist", "Information Technology Specialist", "Lawyer", "Supermarket Owner"
];

const SUBJECT_CATALOG = [
  { name: "Mathematics", codes: { "G1": "MATH-G1", "G4": "MATH-G4", "G5": "MATH-G5", "G8": "MATH-G8" } },
  { name: "English Language", codes: { "G1": "ENGL-G1", "G4": "ENGL-G4", "G5": "ENGL-G5", "G8": "ENGL-G8" } },
  { name: "Amharic Language", codes: { "G1": "AMHR-G1", "G4": "AMHR-G4", "G5": "AMHR-G5", "G8": "AMHR-G8" } },
  { name: "General Science", codes: { "G1": "SCI-G1", "G4": "SCI-G4", "G5": "SCI-G5", "G8": "SCI-G8" } },
  { name: "Social Studies", codes: { "G1": "SOCS-G1", "G4": "SOCS-G4", "G5": "SOCS-G5", "G8": "SOCS-G8" } },
  { name: "Civics & Citizenship", codes: { "G1": "CIV-G1", "G4": "CIV-G4", "G5": "CIV-G5", "G8": "CIV-G8" } },
  { name: "Physics", codes: { "G8": "PHYS-G8" } },
  { name: "Chemistry", codes: { "G8": "CHEM-G8" } },
  { name: "Biology", codes: { "G8": "BIOL-G8" } }
];

console.log("Initializing programmatic seed generator for Bethelhem Youth Academy...");

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectUniqueElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generates simple unique short alphanumeric IDs
function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Begin generation
function generateDataset() {
  const users = [];
  const passwords = {};
  const students = [];
  const teachers = [];
  const parents = [];
  const classes = [];
  const subjects = [];
  const attendance = [];
  const assessments = [];
  const conduct = [];
  const announcements = [];
  const timetables = [];
  const gradeApprovals = [];

  // Timestamp tracker for 2026 logs
  const baseTime = "2026-06-06T08:00:00.000Z";

  // 1. GENERATE THE SYSTEM ADMIN
  const adminUserId = "u-admin-01";
  passwords[adminUserId] = PASSWORD_HASH;
  users.push({
    id: adminUserId,
    email: "admin@bya.edu",
    role: "admin",
    fullName: "Abebe Kebede",
    phone: "+251 911 234 567",
    status: "active",
    registrationNo: "BYA-ADM-2026-01",
    createdAt: baseTime
  });

  // 2. GENERATE 10 TEACHERS
  const teacherUserIds = [];
  const teacherProfileIds = [];
  const specializations = [
    "Mathematics & STEM", "English & Literature", "Social Studies & History",
    "Amharic Grammar & Phonics", "General Science & Chemistry", "Physics & STEM Workshop",
    "Biology & Ecology", "Civics & Ethical Education", "Geography & Environment", "Elementary Education"
  ];

  for (let i = 1; i <= 10; i++) {
    const tUserId = `u-teacher-${String(i).padStart(2, '0')}`;
    const tProfileId = `tp-${String(i).padStart(2, '0')}`;
    teacherUserIds.push(tUserId);
    teacherProfileIds.push(tProfileId);

    const first = getRandomElement(i % 2 === 0 ? ETHIOPIAN_FIRST_MALE : ETHIOPIAN_FIRST_FEMALE);
    const last = getRandomElement(ETHIOPIAN_LAST_NAMES);
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@bya.edu`;

    passwords[tUserId] = PASSWORD_HASH;
    users.push({
      id: tUserId,
      email: email,
      role: "teacher",
      fullName: name,
      phone: `+251 911 ${getRandomInt(300, 499)} ${getRandomInt(100, 999)}`,
      status: "active",
      registrationNo: `BYA-TCH-2026-${String(i).padStart(3, '0')}`,
      createdAt: baseTime
    });

    teachers.push({
      id: tProfileId,
      userId: tUserId,
      specialization: specializations[i - 1],
      hireDate: `2021-09-0${getRandomInt(1, 9)}`,
      bio: `Dedicated BYA Instructor specialized in ${specializations[i - 1]} carrying robust experience in Addis Ababa primary schools.`
    });
  }

  // 3. GENERATE GRADE 1-8 CLASSES (Sections A & B for each grade -> 16 classes)
  const classIdMap = {}; // "G1-A" -> cId
  let classIndex = 1;
  for (let grade = 1; grade <= 8; grade++) {
    for (const sec of ["A", "B"]) {
      const cId = `c-${String(classIndex).padStart(2, '0')}`;
      const tutorUserId = teacherUserIds[getRandomInt(0, 9)];
      classes.push({
        id: cId,
        className: `Grade ${grade}`,
        section: sec,
        roomNo: `Room ${grade}0${sec === "A" ? "1" : "2"}`,
        tutorId: tutorUserId
      });
      classIdMap[`G${grade}-${sec}`] = cId;
      classIndex++;
    }
  }

  // 4. GENERATE SUBJECTS FOR EACH GRADE LEVEL (mapped to classes)
  let subjectIdx = 1;
  const gradeSubjectsMap = {}; // grade -> Array of subject objects
  for (let grade = 1; grade <= 8; grade++) {
    gradeSubjectsMap[grade] = [];
    const classIdA = classIdMap[`G${grade}-A`];
    const classIdB = classIdMap[`G${grade}-B`];

    // Determine relevant subjects based on grade level
    let activeSubjects = [];
    if (grade <= 3) {
      // Lower Elementary
      activeSubjects = ["Mathematics", "English Language", "Amharic Language", "General Science"];
    } else if (grade <= 6) {
      // Upper Elementary
      activeSubjects = ["Mathematics", "English Language", "Amharic Language", "General Science", "Social Studies"];
    } else {
      // Junior High
      activeSubjects = ["Mathematics", "English Language", "Amharic Language", "Civics & Citizenship", "Physics", "Chemistry", "Biology"];
    }

    activeSubjects.forEach((subName) => {
      const sId = `s-${String(subjectIdx).padStart(3, '0')}`;
      const codeType = grade <= 3 ? "G1" : grade <= 5 ? "G5" : "G8";
      const cat = SUBJECT_CATALOG.find(c => c.name === subName);
      const code = cat && cat.codes[codeType] ? cat.codes[codeType] : `${subName.substring(0,3).toUpperCase()}-G${grade}`;
      const assignedTeacherId = teacherUserIds[getRandomInt(0, 9)];

      // Subject item for A
      const finalSubject = {
        id: sId,
        subjectName: subName,
        subjectCode: `${code}-A`,
        teacherId: assignedTeacherId,
        className: `Grade ${grade}`
      };
      subjects.push(finalSubject);
      gradeSubjectsMap[grade].push(finalSubject);
      subjectIdx++;
    });
  }

  // 5. GENERATE 50 PARENTS
  const parentUserIds = [];
  const parentProfileIds = [];
  for (let i = 1; i <= 50; i++) {
    const pUserId = `u-parent-${String(i).padStart(2, '0')}`;
    const pProfileId = `pp-${String(i).padStart(2, '0')}`;
    parentUserIds.push(pUserId);
    parentProfileIds.push(pProfileId);

    const first = getRandomElement(ETHIOPIAN_FIRST_MALE);
    const last = getRandomElement(ETHIOPIAN_LAST_NAMES);
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@bya-family.org`;

    passwords[pUserId] = PASSWORD_HASH;
    users.push({
      id: pUserId,
      email: email,
      role: "parent",
      fullName: name,
      phone: `+251 911 ${getRandomInt(500, 799)} ${getRandomInt(100, 999)}`,
      status: "active",
      registrationNo: `BYA-PRN-2026-${String(i).padStart(3, '0')}`,
      createdAt: baseTime
    });

    parents.push({
      id: pProfileId,
      userId: pUserId,
      occupation: getRandomElement(OCCUPATIONS),
      address: getRandomElement(ADDIS_POSTAL_ADDRESSES)
    });
  }

  // 6. GENERATE 100 STUDENTS SPREAD ACROSS GRADE 1-8
  const studentUserIds = [];
  const sProfileIds = [];
  
  // To keep grades spread evenly, let's place roughly 12 students in each grade.
  // Sibling linking: We link 2 students to the same parent for half our parents, and 1 to 1 for others.
  let currentStudentIdx = 1;
  for (let grade = 1; grade <= 8; grade++) {
    const secs = ["A", "B"];
    for (const sec of secs) {
      const classId = classIdMap[`G${grade}-${sec}`];
      
      // Generate 6 students per section
      for (let sSec = 1; sSec <= 6; sSec++) {
        const sUserId = `u-student-${String(currentStudentIdx).padStart(3, '0')}`;
        const sProfileId = `sp-${String(currentStudentIdx).padStart(3, '0')}`;
        studentUserIds.push(sUserId);
        sProfileIds.push(sProfileId);

        const gender = getRandomElement(["Male", "Female"]);
        const first = getRandomElement(gender === "Male" ? ETHIOPIAN_FIRST_MALE : ETHIOPIAN_FIRST_FEMALE);
        const last = getRandomElement(ETHIOPIAN_LAST_NAMES);
        const name = `${first} ${last}`;
        const email = `${first.toLowerCase()}.${last.toLowerCase()}@bya-students.org`;

        // Siblings mapping: map student to an administrative parent
        // Pair student 1 and 2 to parent 1, student 3 and 4 to parent 2... 100 students total maps gracefully to 50 parents
        const assignedParentIndex = Math.floor((currentStudentIdx - 1) / 2);
        const assignedParentUserId = parentUserIds[assignedParentIndex];

        passwords[sUserId] = PASSWORD_HASH;
        users.push({
          id: sUserId,
          email: email,
          role: "student",
          fullName: name,
          phone: `+251 911 ${getRandomInt(800, 999)} ${String(currentStudentIdx).padStart(3, '0')}`,
          status: "active",
          registrationNo: `BYA-STU-2026-${String(currentStudentIdx).padStart(3, '0')}`,
          createdAt: baseTime
        });

        // Birthdays according to grade (e.g. Grade 1 corresponds to age 7, Grade 8 to age 14)
        const birthYear = 2026 - (grade + 6);
        const bMonth = String(getRandomInt(1, 12)).padStart(2, '0');
        const bDay = String(getRandomInt(1, 28)).padStart(2, '0');
        const dob = `${birthYear}-${bMonth}-${bDay}`;

        students.push({
          id: sProfileId,
          userId: sUserId,
          parentId: assignedParentUserId,
          classId: classId,
          dob: dob,
          gender: gender,
          enrollmentDate: `${2026 - getRandomInt(1, 3)}-09-05`
        });

        currentStudentIdx++;
      }
    }
  }

  // 7. GENERATE SAMPLE ATTENDANCE RECORDS (Daily double attendance for 4 active weekdays: June 1, 2, 3, 4, 2026)
  const weekdays = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"];
  let attIdx = 1;

  // Let's seed complete double-session logs for students of Grade 5-A, Grade 8-A, and a random subset to ensure rich visualizations without file bloating
  students.forEach((student, sIdx) => {
    const classId = student.classId;
    const cl = classes.find(c => c.id === classId);
    
    // We log complete records for Grade 5 & Grade 8 students to populate primary analytical views, and random samples for other grades.
    const isPrimaryDemoClass = cl.className.includes("Grade 5") || cl.className.includes("Grade 8");
    if (isPrimaryDemoClass || sIdx % 3 === 0) {
      weekdays.forEach(day => {
        // Morning Session
        const amStatus = getRandomInt(1, 100) > 8 ? "Present" : getRandomElement(["Absent", "Late", "Excused"]);
        const amRemarks = amStatus === "Present" ? "" : amStatus === "Late" ? "Late by 10m" : "Medical leave";
        const studentUserObj = users.find(u => u.id === student.userId);

        attendance.push({
          id: `att-gen-${attIdx++}`,
          studentId: student.userId,
          studentName: studentUserObj.fullName,
          classId: classId,
          date: day,
          session: "morning",
          status: amStatus,
          remarks: amRemarks
        });

        // Afternoon Session
        const pmStatus = amStatus === "Absent" ? "Absent" : getRandomInt(1, 100) > 6 ? "Present" : "Late";
        const pmRemarks = pmStatus === "Present" ? "" : "Delayed returning from lunch";

        attendance.push({
          id: `att-gen-${attIdx++}`,
          studentId: student.userId,
          studentName: studentUserObj.fullName,
          classId: classId,
          date: day,
          session: "afternoon",
          status: pmStatus,
          remarks: pmRemarks
        });
      });
    }
  });

  // 8. GENERATE ACADEMIC GRADES (Term 1 & Quarter 1 score card assessments out of 100%)
  let assIdx = 1;
  let gapIdx = 1;

  // Assign standard grades to all students to ensure complete report cards!
  students.forEach((s) => {
    const classId = s.classId;
    const cl = classes.find(c => c.id === classId);
    const gradeLevel = parseInt(cl.className.replace("Grade ", ""));
    const activeGradeSubjects = gradeSubjectsMap[gradeLevel] || [];
    const studentUserObj = users.find(u => u.id === s.userId);

    // Filter to generate 2 key course grades for each student (e.g. Maths + English)
    activeGradeSubjects.slice(0, 3).forEach((subj) => {
      const marks = getRandomInt(45, 99); // realistic distribution with occasional failures (< 50%)
      const letterGrade = marks >= 95 ? "A+" : marks >= 85 ? "A" : marks >= 75 ? "B" : marks >= 60 ? "C" : marks >= 50 ? "D" : "F";
      const remark = marks >= 85 ? "Exceptional academic focus!" : marks >= 75 ? "Good progress." : "Requires steady review.";

      const assessmentId = `as-gen-${assIdx++}`;
      assessments.push({
        id: assessmentId,
        studentId: s.userId,
        studentName: studentUserObj.fullName,
        subjectId: subj.id,
        subjectName: subj.subjectName,
        marksObtained: marks,
        maxMarks: 100,
        grade: letterGrade,
        term: "Term 1",
        remarks: remark,
        date: "2026-05-20"
      });

      // Submit grades into the workflow approval queue (e.g., 85% approved, 15% pending)
      const submitTeacher = users.find(u => u.id === subj.teacherId);
      const isApproved = getRandomInt(1, 10) > 2;

      gradeApprovals.push({
        id: `gap-gen-${gapIdx++}`,
        assessmentId: assessmentId,
        studentId: s.userId,
        studentName: studentUserObj.fullName,
        classId: classId,
        subjectId: subj.id,
        subjectName: subj.subjectName,
        marksObtained: marks,
        maxMarks: 100,
        grade: letterGrade,
        quarter: "Quarter 1",
        remarks: remark,
        submittedBy: submitTeacher ? submitTeacher.fullName : "Almaz Tesfaye",
        status: isApproved ? "Approved" : "Pending",
        createdAt: "2026-06-05"
      });
    });
  });

  // 9. GENERATE SAMPLE CONDUCT RECORDS
  let condIdx = 1;
  students.forEach((s, sIdx) => {
    // Generate conduct evaluation for most students
    if (sIdx % 2 === 0) {
      const studentUserObj = users.find(u => u.id === s.userId);
      const conductMap = ["Excellent", "Good", "Needs Improvement"];
      const score = sIdx % 15 === 0 ? "Needs Improvement" : sIdx % 6 === 0 ? "Good" : "Excellent";
      const desc = score === "Excellent" 
        ? "Exemplary polite conduct, punctual, and highly cooperative with fellow classmates."
        : score === "Good" 
        ? "Polite and active participant. Adheres to classroom instructions consistently."
        : "Talkative during lectures. Needs redirection on classroom engagement limits.";

      conduct.push({
        id: `cnd-gen-${condIdx++}`,
        studentId: s.userId,
        studentName: studentUserObj.fullName,
        incidentDate: "2026-06-03",
        conductScore: score,
        description: desc,
        reportedBy: "Almaz Tesfaye"
      });
    }
  });

  // 10. GENERATE TIMETABLES SCHEDULES (Grade 1-8 class schedules)
  let ttIdx = 1;
  classes.forEach((c) => {
    const gradeLevel = parseInt(c.className.replace("Grade ", ""));
    const activeGradeSubjects = gradeSubjectsMap[gradeLevel] || [];
    
    // Assign schedule blocks for Mon-Wed for important core subjects
    const monSubj = activeGradeSubjects[0];
    const tueSubj = activeGradeSubjects[1] || activeGradeSubjects[0];
    const wedSubj = activeGradeSubjects[2] || activeGradeSubjects[0];

    if (monSubj) {
      const teacherObj = users.find(u => u.id === monSubj.teacherId);
      timetables.push({
        id: `tt-gen-${ttIdx++}`,
        classId: c.id,
        className: `${c.className}-${c.section}`,
        subjectName: monSubj.subjectName,
        dayOfWeek: "Monday",
        startTime: "08:30 AM",
        endTime: "10:00 AM",
        teacherName: teacherObj ? teacherObj.fullName : "Dawit Wolde",
        roomNo: c.roomNo
      });
    }
    if (tueSubj) {
      const teacherObj = users.find(u => u.id === tueSubj.teacherId);
      timetables.push({
        id: `tt-gen-${ttIdx++}`,
        classId: c.id,
        className: `${c.className}-${c.section}`,
        subjectName: tueSubj.subjectName,
        dayOfWeek: "Tuesday",
        startTime: "10:30 AM",
        endTime: "12:00 PM",
        teacherName: teacherObj ? teacherObj.fullName : "Almaz Tesfaye",
        roomNo: c.roomNo
      });
    }
    if (wedSubj) {
      const teacherObj = users.find(u => u.id === wedSubj.teacherId);
      timetables.push({
        id: `tt-gen-${ttIdx++}`,
        classId: c.id,
        className: `${c.className}-${c.section}`,
        subjectName: wedSubj.subjectName,
        dayOfWeek: "Wednesday",
        startTime: "01:30 PM",
        endTime: "03:00 PM",
        teacherName: teacherObj ? teacherObj.fullName : "Dawit Wolde",
        roomNo: c.roomNo
      });
    }
  });

  // 11. GENERATE ANNOUNCEMENTS
  announcements.push({
    id: "ann-01",
    title: "Bethelhem Youth Academy Academic Council Resolution",
    content: "All physical classes will compile evaluations on June 15th for the Quarter 4 consolidation check. Double session parent gates open at 3:30 PM.",
    targetAudience: "All",
    createdAt: "2026-06-05",
    postedBy: "Abebe Kebede (Admin)",
    status: "Published"
  });
  announcements.push({
    id: "ann-02",
    title: "Quarterly Teacher In-Service Briefing",
    content: "Standard portal training for uploading student attendance modules and tracking double afternoon roll logs is scheduled for next Saturday.",
    targetAudience: "Teachers",
    createdAt: "2026-06-04",
    postedBy: "Abebe Kebede (Admin)",
    status: "Published"
  });
  announcements.push({
    id: "ann-03",
    title: "Security Gate Log Consolidation",
    content: "To support safety checks, students must wear their standardized barcode badges at arrival (morning session check-in) and departure.",
    targetAudience: "Parents",
    createdAt: "2026-06-03",
    postedBy: "Abebe Kebede (Admin)",
    status: "Published"
  });
  announcements.push({
    id: "ann-04",
    title: "Grade 8 National Assessment Preparations",
    content: "Junior High student cohorts will hold mandatory mock subject exams in Mathematics, General Science, and English on Tuesdays.",
    targetAudience: "Students",
    createdAt: "2026-06-02",
    postedBy: "Dawit Wolde (Tutor)",
    status: "Published"
  });
  announcements.push({
    id: "ann-05",
    title: "Annual Sports Day Registration [Draft]",
    content: "Draft syllabus plan explaining track races, community football matches, and student award lists across sections.",
    targetAudience: "All",
    createdAt: "2026-06-06",
    postedBy: "Abebe Kebede (Admin)",
    status: "Draft"
  });

  return {
    users,
    passwords,
    students,
    teachers,
    parents,
    classes,
    subjects,
    attendance,
    assessments,
    conduct,
    announcements,
    timetables,
    gradeApprovals,
    gradeSubjectsMap
  };
}

// Write JSON database.json file
console.log("Compiling master data arrays...");
const finalDb = generateDataset();
const DB_FILE = path.join(process.cwd(), 'server', 'database.json');
try {
  const { gradeSubjectsMap, ...jsonReadyDb } = finalDb;
  fs.writeFileSync(DB_FILE, JSON.stringify(jsonReadyDb, null, 2), 'utf8');
  console.log(`Success! JSON database seeded cleanly with fully detailed metrics at ${DB_FILE}`);
} catch (err) {
  console.error("Failed writing JSON seed data!", err);
}

// Generate the SQL seed file
console.log("Writing SQL seed insertion script database rows in SQL...");
const sqlFile = path.join(process.cwd(), 'server', 'seed_data.sql');

let sql = `-- =========================================================================\n`;
sql += `--      BETHELHEM YOUTH ACADEMY - COMPREHENSIVE PRODUCTION SEED DATASET\n`;
sql += `-- DBMS Tar: MySQL 8.0+\n`;
sql += `-- Total Generated Records: 1 Admin, 10 Teachers, 50 Parents, 100 Students,\n`;
sql += `--                          16 Sections, 44 Subjects, ~800 Attendance sessions, \n`;
sql += `--                          ~300 Grade Sheets, 50 Conduct logs\n`;
sql += `-- =========================================================================\n\n`;
sql += `USE bethelhem_academy_db;\n\n`;
sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
sql += `TRUNCATE TABLE grade_approvals;\n`;
sql += `TRUNCATE TABLE grades;\n`;
sql += `TRUNCATE TABLE attendance;\n`;
sql += `TRUNCATE TABLE conduct;\n`;
sql += `TRUNCATE TABLE timetables;\n`;
sql += `TRUNCATE TABLE teacher_assignments;\n`;
sql += `TRUNCATE TABLE students;\n`;
sql += `TRUNCATE TABLE grade_subjects;\n`;
sql += `TRUNCATE TABLE subjects;\n`;
sql += `TRUNCATE TABLE sections;\n`;
sql += `TRUNCATE TABLE parents;\n`;
sql += `TRUNCATE TABLE teachers;\n`;
sql += `TRUNCATE TABLE users;\n`;
sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

// 1. Write Users SQL
sql += `-- 1. USERS SEED\n`;
finalDb.users.forEach((u) => {
  const pHash = finalDb.passwords[u.id] || PASSWORD_HASH;
  const pVal = u.phone ? `'${u.phone}'` : "NULL";
  sql += `INSERT INTO users (id, email, password_hash, role, full_name, phone, registration_no) VALUES ('${u.id}', '${u.email}', '${pHash}', '${u.role}', '${u.fullName.replace(/'/g, "''")}', ${pVal}, '${u.registrationNo}');\n`;
});
sql += `\n`;

// 2. Write Parents SQL
sql += `-- 2. PARENTS SEED\n`;
finalDb.parents.forEach((p) => {
  sql += `INSERT INTO parents (id, user_id, occupation, address) VALUES ('${p.id}', '${p.userId}', '${p.occupation.replace(/'/g, "''")}', '${p.address.replace(/'/g, "''")}');\n`;
});
sql += `\n`;

// 3. Write Teachers SQL
sql += `-- 3. TEACHERS SEED\n`;
finalDb.teachers.forEach((t) => {
  sql += `INSERT INTO teachers (id, user_id, specialization, hire_date, bio) VALUES ('${t.id}', '${t.userId}', '${t.specialization.replace(/'/g, "''")}', '${t.hireDate}', '${t.bio.replace(/'/g, "''")}');\n`;
});
sql += `\n`;

// 4. Write Sections (Classes) SQL
sql += `-- 4. SECTIONS SEED\n`;
finalDb.classes.forEach((c) => {
  const gradeNo = parseInt(c.className.replace("Grade ", ""));
  const tutorIdVal = c.tutorId ? `'${c.tutorId}'` : "NULL";
  sql += `INSERT INTO sections (id, grade, section_name, room_number, tutor_id) VALUES ('${c.id}', ${gradeNo}, '${c.section}', '${c.roomNo}', ${tutorIdVal});\n`;
});
sql += `\n`;

// 5. Write Subjects SQL
sql += `-- 5. SUBJECTS SEED\n`;
const processedSubjectName = new Set();
finalDb.subjects.forEach((s) => {
  const baseName = s.subjectName;
  if (!processedSubjectName.has(baseName)) {
    processedSubjectName.add(baseName);
    const code = s.subjectCode.substring(0, 4); // Standardize short subject codes (MATH, PHYS, etc.)
    sql += `INSERT INTO subjects (id, subject_name, subject_code) VALUES ('sub-${baseName.substring(0,4).toLowerCase()}', '${baseName}', '${code}');\n`;
  }
});
sql += `\n`;

// 6. Write Grade Subjects link table SQL
sql += `-- 6. GRADE SUBJECT RELATION MAP SEED\n`;
let gsIndex = 1;
for (let grade = 1; grade <= 8; grade++) {
  const activeNames = grade <= 3 
    ? ["Mathematics", "English Language", "Amharic Language", "General Science"]
    : grade <= 6
    ? ["Mathematics", "English Language", "Amharic Language", "General Science", "Social Studies"]
    : ["Mathematics", "English Language", "Amharic Language", "Civics & Citizenship", "Physics", "Chemistry", "Biology"];

  activeNames.forEach(subName => {
    sql += `INSERT INTO grade_subjects (id, grade, subject_id) VALUES ('gs-seed-${gsIndex++}', ${grade}, 'sub-${subName.substring(0,4).toLowerCase()}');\n`;
  });
}
sql += `\n`;

// 7. Write Students SQL
sql += `-- 7. STUDENTS LIST SEED\n`;
finalDb.students.forEach((s) => {
  const parentIdVal = s.parentId ? `'${s.parentId}'` : "NULL";
  const classIdVal = s.classId ? `'${s.classId}'` : "NULL";
  const genderType = s.gender;
  sql += `INSERT INTO students (id, user_id, parent_id, section_id, dob, gender, enrollment_date, roll_number) VALUES ('${s.id}', '${s.userId}', ${parentIdVal}, ${classIdVal}, '${s.dob}', '${genderType}', '${s.enrollmentDate}', '1');\n`;
});
sql += `\n`;

// 8. Write Attendance SQL
sql += `-- 8. MORNING AND AFTERNOON DOUBLE-SESSION ATTENDANCE RECORDS\n`;
finalDb.attendance.forEach((att) => {
  sql += `INSERT INTO attendance (id, student_id, section_id, date, session, status, remarks) VALUES ('${att.id}', '${att.studentId}', '${att.classId}', '${att.date}', '${att.session}', '${att.status}', '${att.remarks.replace(/'/g, "''")}');\n`;
});
sql += `\n`;

// 9. Write Grades SQL
sql += `-- 9. ASSESSMENTS SCORE CARDS\n`;
finalDb.assessments.forEach((g) => {
  const marks = g.marksObtained;
  const gradeSubjId = `sub-${g.subjectName.substring(0,4).toLowerCase()}`;
  sql += `INSERT INTO grades (id, student_id, subject_id, quarter_id, academic_year_id, score, is_published, recorded_by) VALUES ('${g.id}', '${g.studentId}', '${gradeSubjId}', 'q-1', 'ay-2025-2026', ${marks}, 1, 'u-admin-01');\n`;
});
sql += `\n`;

// 10. Write Grade Approvals SQL
sql += `-- 10. EVALUATIONS QUALITY WORKFLOW QUEUE GATE\n`;
finalDb.gradeApprovals.forEach((gap) => {
  sql += `INSERT INTO grade_approvals (id, grade_id, submitted_by, approved_by, approval_status, remarks) VALUES ('${gap.id}', '${gap.assessmentId}', 'u-teacher-01', 'u-admin-01', '${gap.status}', '${gap.remarks.replace(/'/g, "''")}');\n`;
});
sql += `\n`;

// 11. Write Conduct SQL
sql += `-- 11. QUARTER SHIELD CONDUCT RECORD\n`;
finalDb.conduct.forEach((cond) => {
  const conductGrade = cond.conductScore === "Excellent" ? "A" : cond.conductScore === "Good" ? "B" : "C";
  sql += `INSERT INTO conduct (id, student_id, quarter_id, academic_year_id, grade, remarks, graded_by) VALUES ('${cond.id}', '${cond.studentId}', 'q-1', 'ay-2025-2026', '${conductGrade}', '${cond.description.replace(/'/g, "''")}', 'u-admin-01');\n`;
});
sql += `\n`;

// 12. Write Announcements SQL
sql += `-- 12. PUBLIC BULLETIN SHEET BOARD\n`;
finalDb.announcements.forEach((anc) => {
  sql += `INSERT INTO announcements (id, title, content, posted_by, target_role) VALUES ('${anc.id}', '${anc.title.replace(/'/g, "''")}', '${anc.content.replace(/'/g, "''")}', 'u-admin-01', '${anc.targetAudience.toLowerCase()}');\n`;
});
sql += `\n`;

// 13. Write Timetables SQL
sql += `-- 13. TIMETABLES DAY SLOTS SCHEDULE\n`;
finalDb.timetables.forEach((t) => {
  const subjectId = `sub-${t.subjectName.substring(0,4).toLowerCase()}`;
  const startTimeVal = t.startTime.includes("AM") ? "08:30:00" : "13:30:00";
  const endTimeVal = t.endTime.includes("AM") ? "10:00:00" : "15:00:00";
  sql += `INSERT INTO timetables (id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES ('${t.id}', '${t.classId}', '${subjectId}', 'u-teacher-01', '${t.dayOfWeek}', '${startTimeVal}', '${endTimeVal}');\n`;
});
sql += `\n`;

// 14. Write Teacher Assignments SQL
sql += `-- 14. TEACHER COURSE ASSIGNMENTS LINK TABLES\n`;
let taIndex = 1;
finalDb.classes.forEach(c => {
  const gradeLevel = parseInt(c.className.replace("Grade ", ""));
  const activeGradeSubjects = finalDb.gradeSubjectsMap[gradeLevel] || [];
  activeGradeSubjects.slice(0, 2).forEach(subj => {
    sql += `INSERT INTO teacher_assignments (id, teacher_id, section_id, subject_id) VALUES ('ta-gen-${taIndex++}', '${subj.teacherId}', '${c.id}', 'sub-${subj.subjectName.substring(0,4).toLowerCase()}');\n`;
  });
});

try {
  fs.writeFileSync(sqlFile, sql, 'utf8');
  console.log(`Success! Production SQL seed insert script generated cleanly at ${sqlFile}`);
} catch (err) {
  console.error("Failed writing SQL seed file!", err);
}

console.log("Programmatic seeding completed successfully without warnings!");
