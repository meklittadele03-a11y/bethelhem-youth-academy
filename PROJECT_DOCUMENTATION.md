# Bethelhem Youth Academy Smart Portal — Complete Project Documentation

Welcome to the official **Master System documentation catalog** for the Bethelhem Youth Academy Smart Portal. This document describes the system architecture, features database models, security rules, user manuals, deployment, and testing workflows, serving as a comprehensive blueprints guide for both system administrators and developer engineers.

---

## 1. System Overview

The **Bethelhem Youth Academy Smart Portal** is a sophisticated, full-stack school management system designed specifically for Grade 1–8 primary and junior high school standards. It coordinates critical school operations, bridges information flow between educators, administrative offices, and parents, and tracks student progress.

The portal solves real-world challenges faced by educational institutions in Addis Ababa:
*   **Double Attendance Logging**: Tracks morning check-in and afternoon check-out presence rolls separately, reflecting actual local transport and session constraints.
*   **Grade Approvals Gate**: Restricts teachers to submitting grades as draft registrations, which must be certified by an administrative manager before they are published to parents.
*   **Printable Report Cards & Transcripts**: Generates beautiful, responsive, single-page printable progress reports designed for parents.
*   **Conduct and Co-Curricular Monitoring**: Houses qualitative reports on students' manners and behavior.

The codebase is built entirely in **TypeScript**, utilizing **React 18/v19 with Vite** for the responsive front-end single-page application (SPA), styled with **Tailwind CSS**, and backed by an **Express API server** carrying a fully compliant, relational **MySQL database** layer.

---

## 2. Core Visual & Functional Features

The application is structured into four specialized, role-tailored dashboards. Below is a breakdown of their primary visual grids and key features:

```
                  +----------------------------------------------+
                  |         BYA Smart Portal Ingress Gateway     |
                  +----------------------------------------------+
                                         |
         +------------------+------------+-----------+--------------------+
         |                  |                        |                    |
+-----------------+ +-----------------+    +-----------------+    +-----------------+
| Admin Dashboard | | Tutors Dashboard |    | Pupil Terminal  |    | Parent Console  |
| - Account mgt   | | - Double presence|    | - Grades status |    | - Child progress|
| - Approval Gate | | - Evaluate scores|    | - Bulletin board|    | - Conduct report|
| - Section slots | | - Conduct grades |    | - Attendance bar|    | - PDF Transcripts|
+-----------------+ +-----------------+    +-----------------+    +-----------------+
```

### 🔑 1. Administrative Officers Dashboard
*   **System Diagnostics KPI Strip**: Displays live cumulative averages, section pass-rate benchmarks, attendance rates, and remediation roster statuses.
*   **Roster Catalogs Manager (Students, Instructors, Parents)**: Unified dashboard to add, view, update, or suspend user identities, including generating registration serials like `BYA-STU-2026-001`.
*   **Administrative Approvals Gate**: Reviews provisional exam evaluations logged by teachers. Admins can hit **Approve** (to publish immediately to students and parent portals) or **Reject** (which sends the entry back to the teacher with remarks).
*   **Double Attendance Audits**: Monitors morning and afternoon attendance rates for all class sections.
*   **Schedules & Timetable Matrix**: Organizes classroom periods, avoiding room overlaps or scheduling conflicts.
*   **Public Bulletin Board Creator**: Publishes and targets announcements to specific audiences (All, Teachers, Parents, Students) with draft modes.

### 🍎 2. Certified Teachers Dashboard
*   **Interactive Double Attendance Check-in Sheet**: Allows fast morning check-in and afternoon check-out logs.
*   **Evals & Scores Ledger**: Logs homework results and classroom exam grades directly. Marks are validated dynamically out of 100% with immediate local estimations of passing outcomes or failing risks.
*   **Workflow Submission Panel**: Integrates with the admin approvals gate, preventing unintended grade exposure with a `Pending` queue list.
*   **Qualitative Conduct Evaluator**: Records behaviors according to A (Excellent), B (Good), and C (Needs Improvement) grading, paired with detailed feedback notes.

### 🎒 3. Student Terminal
*   **Student Academic Records Tracker**: Displays approved quiz scores and homework feedbacks, hiding pending exams.
*   **Personal Attendance Calendar Sheet**: Reports check-in history with responsive color indicators.
*   **School Announcements Bulletin**: Keeps students informed about school events.
*   **Personal Timetable Grid**: Lists the weekly class schedule.

### 👨‍👩‍👧 4. Parent Console
*   **Multi-Child Telemetry Overview**: Tracks progress and grade medians for siblings.
*   **Official Transcript Generator**: Allows printing or exporting clean, single-page, A4-formatted report cards.
*   **Behavior and Conduct Audit**: Displays teacher conduct reviews.
*   **Notifications Bell Panel**: Keeps parents informed of targeted bulletins.

---

## 3. Relational Database Schema Explanation

Our production deployment maps academic entities to an enterprise **MySQL v8.0+** engine using strict relational integrity, cascading foreign keys, and domain checks:

```
                            +-------------------+
                            |    users Table    |
                            +-------------------+
                                      |
         +------------------+---------+---------+--------------------+
         |                  |                   |                    |
+-----------------+ +-----------------+ +---------------+    +-----------------+
|  parents Table  | |  teachers Table | |   sections    |    |  announcements  |
+-----------------+ +-----------------+ +---------------+    +-----------------+
         |                                      |
         +------------------+-------------------+
                            |
                  +-------------------+
                  |  students Table   |
                  +-------------------+
                            |
         +------------------+---------+--------------------+
         |                  |                              |
+-----------------+ +-----------------+            +---------------+
|   grades Table  | |   attendance    |            |    conduct    |
+-----------------+ +-----------------+            +---------------+
         |
+-----------------+
| grade_approvals |
+-----------------+
```

### 1. Identity & Profile Tables
*   `users`: The central accounts table. Encrypts login passwords using **bcrypt/scrypt** and enforces distinct privileges using the `role` enum context (`'admin'`, `'teacher'`, `'student'`, `'parent'`).
*   `teachers`: Holds teacher-specific profiles, including phone contacts, hire dates, active contracts, and certifications.
*   `parents`: Connects parents to their contact phone, home address, and occupation.
*   `students`: Connects each student user to a unique registration number, their parent's profile, and their assigned grade section. Enforces uniqueness on `registration_no`.

### 2. School Structure & Scheduling Tables
*   `sections`: Maps classroom identifiers. Holds the classroom number and limits the grade level to Grade 1–8 primary standards.
*   `subjects`: Holds academic courses like Mathematics or Amharic with unique, short codes like `MATH`.
*   `grade_subjects`: A validation bridge restricting syllabus subjects to specific grade levels.
*   `timetables`: Stores weekly course calendars. Enforces scheduling rules using a unique index layout `(section_id, day_of_week, start_time)` to avoid scheduling conflicts.

### 3. Logistical & Operational Tables
*   `attendance`: Log records tracking morning/afternoon presence. Houses a unique composite index `(student_id, date, session)` to enforce double-session attendance constraints.
*   `grades`: Stores academic marks. Enforces a 100-mark max score constraint and calculates pass status based on a standard 50% GPA threshold.
*   `grade_approvals`: Acts as a workflow gate. It references `grades` and manages the `'Pending'`, `'Approved'`, or `'Rejected'` state.
*   `conduct`: Logs qualitative behavioral evaluations for each student per quarter.
*   `announcements`: Manages targeted school messages.

---

## 4. User Roles & Privilege Matrix

System resource boundaries and route privileges are declared strictly at both the client UI layer and the backend Express controller layer:

| Functional Capability | Admin Officer | Certified Teacher | Student Cohort | Parent / Guardian |
| :--- | :---: | :---: | :---: | :---: |
| **Manage System Accounts** | Write / Edit / Delete | No Access | No Access | No Access |
| **Verify Grade Approvals** | Write / Edit (Approve) | Read Only | No Access | No Access |
| **Create Schedules & Timetables**| Write / Edit / Delete | Read Only | Read Only | Read Only |
| **Submit Draft Evaluations** | Full Access | Write / Edit (Own class) | No Access | No Access |
| **Log Double Attendance Sheets** | Full Access | Write / Edit (Own class) | No Access | No Access |
| **Log Quarterly Conduct Reports**| Full Access | Write / Edit (Own class) | No Access | No Access |
| **Publish Bulletin Announcements** | Custom Audits | Write / Edit | No Access | No Access |
| **Read Personal Transcripts** | Read Only | Read Only | Read Only (Owner) | Read Only (Children) |
| **Print Certified Report Cards** | Full Access | Read Only | Read Only (Owner) | Read Only (Children) |

---

## 5. API Documentation (REST Specs)

All REST routes operate securely, validating JWT authorization headers.

### A. Authentication Endpoints

#### 1. Session Login Gateway
*   **Endpoint / Action**: `POST /api/auth/login`
*   **Access Privileges**: Public
*   **Request Body JSON**:
    ```json
    {
      "username": "admin",
      "password": "password123"
    }
    ```
*   **Expected Response (Status 200)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "u-admin-01",
        "email": "admin@bya.edu",
        "role": "admin",
        "fullName": "Abebe Kebede"
      }
    }
    ```

#### 2. Get Active User Context
*   **Endpoint / Action**: `GET /api/auth/me`
*   **Access Privileges**: Authenticated
*   **Headers**: `Authorization: Bearer <token>`
*   **Expected Response**: Returns the logged-in user profile object.

---

### B. Student Management Endpoints

#### 1. Query Registered Students List
*   **Endpoint / Action**: `GET /api/students`
*   **Query Parameters**: `classId` *(optional)*, `registrationNo` *(optional)*
*   **Access Privileges**: Admin, Teacher, Parent
*   **Expected Response (Status 200)**:
    ```json
    [
      {
        "id": "sp-001",
        "userId": "u-student-01",
        "fullName": "Yonas Tesfaye",
        "registrationNo": "BYA-STU-2026-001",
        "classId": "c-01",
        "className": "Grade 5-A",
        "parentId": "u-parent-01"
      }
    ]
    ```

#### 2. Create Student Profile
*   **Endpoint / Action**: `POST /api/students`
*   **Access Privileges**: Admin Only
*   **Request Body JSON**:
    ```json
    {
      "username": "yonastesfaye",
      "fullName": "Yonas Tesfaye",
      "email": "yonas@bya-student.org",
      "phone": "+251911440055",
      "classId": "c-01",
      "parentId": "u-parent-01",
      "gender": "Male",
      "dob": "2015-04-12"
    }
    ```

---

### C. Logistics, Attendance, and Evaluation Endpoints

#### 1. Fetch Class Double Attendance Logs
*   **Endpoint / Action**: `GET /api/attendance`
*   **Query Parameters**: `classId` *(required)*, `date` *(required)*
*   **Access Privileges**: Admin, Teacher
*   **Expected Response**: Array of morning and afternoon attendance checks.

#### 2. Submit Double Attendance Check sheet
*   **Endpoint / Action**: `POST /api/attendance`
*   **Access Privileges**: Admin, Teacher
*   **Request Body JSON**:
    ```json
    {
      "studentId": "u-student-01",
      "classId": "c-01",
      "date": "2026-06-06",
      "session": "morning",
      "status": "Present",
      "remarks": ""
    }
    ```

#### 3. Request Compiled Academic Transcript Data
*   **Endpoint / Action**: `GET /api/report-card`
*   **Query Parameters**: `studentId` *(required)*, `quarter` *(required)*
*   **Access Privileges**: Authenticated
*   **Expected Response (Status 200)**:
    ```json
    {
      "student": { "fullName": "Yonas Tesfaye", "registrationNo": "BYA-STU-2026-001" },
      "quarter": "Quarter 1",
      "grades": [
        { "subjectName": "Mathematics", "marksObtained": 88, "maxMarks": 100, "grade": "A", "status": "Approved" }
      ],
      "conduct": { "conductScore": "Excellent", "description": "Exemplary polite conduct" },
      "rank": 2,
      "classAverage": 78
    }
    ```

---

## 6. Comprehensive Installation & Setup Guide

Get the Bethelhem Youth Academy Smart Portal running locally in three development phases:

### Phase A: Prerequisite Framework Installs
Ensure your local machine has the following software installed:
1.  **Node.js**: Recommended v18.x or v20.x stable LTS.
2.  **Git**: Standard command line client.
3.  **MySQL Server**: Recommended v8.0 or higher.

### Phase B: Quickstart Installation Commands
Clone the repository and install project dependencies:
```bash
# 1. Clone your project path
git clone https://github.com/your-org/bethelhem-smart-portal.git
cd bethelhem-smart-portal

# 2. Install server + client NPM packages
npm run install-all
```

### Phase C: Seeding and Development Startup
Run our built-in scripts to generate realistic seed data and launch the server:
```bash
# 3. Provision database.json and generate seed SQL
npx tsx scripts/generate_seed_data.js

# 4. Spin up the Vite developers compiler and Express backend
npm run dev
```
Open **`http://localhost:3000`** in your browser. Use the staging credentials:
*   **System Admin**: username `admin` / password `password`
*   **Certified Teacher**: username `teacher` / password `password`
*   **Student Cohort**: username `student` / password `password`
*   **Parent Console**: username `parent` / password `password`

---

## 7. Operational User Manual

Step-by-step administrative guides for everyday school scenarios:

```
+--------------------------------------------------------------------------+
|                 ADMIN ONBOARDING FLIGHT-DECK PATH                        |
+--------------------------------------------------------------------------+
|  Step 1: Check-in as Administrator -> Open Accounts catalogs             |
|  Step 2: Add Parent Profile first -> Copy generated parent identity code |
|  Step 3: Register Student -> Paste Parent ID to link siblings            |
|  Step 4: Register Teachers -> Declare credentials specialization         |
|  Step 5: Schedule sections and courses inside Class calendars            |
+--------------------------------------------------------------------------+
```

### Scenario A: Registering a New Student and Parent
Enforce relational mapping between parents and student cohorts by following this sequence:
1.  **Administrative Login**: Authenticate as an Academic Officer using credentials `admin` / `password`.
2.  **Onboard Parent Identity**: Select **Parents** inside your Admin Navigation, then click **Add Parent Profile**. Populate the guardian's contact fields (e.g., Almaz Tesfaye, Business Owner, bole) and hit Submit.
3.  **Copy Parent ID**: Note the parent's generated ID code from the parents catalog table.
4.  **Register Student Cohort**: Select **Students** and click **Add Student**. Fill out the details (Yonas Tesfaye, Grade 5-A, male) and paste the copied parent ID to link the child to their parent.
5.  Verification: The student can now log in using `yonastesfaye` / `password123`, and the parent will see their child's records automatically.

### Scenario B: Standard Quarter Progress Assessment Cycles
How grades are logged, approved, and published securely:
1.  **Teacher Inputs Draft Marks**: A teacher logs into the portal using `teacher`/`password` and goes to the grades panel. They select Grade `5A - Mathematics` and log a spelling quiz score of `85%`. The status defaults to as `Pending Admin Review`.
2.  **Administrator Audits Submissions**: The administrator logs in, navigates to the **Approvals Gate**, and reviews the pending mathematics grade. They click **Approve** to publish it.
3.  **Parent Generates Certified Transcript**: The parenting account logs into the portal, navigates to the child's academic reports panel, and clicks **Export Report / PDF** to print the certified report card.

---

## 8. Relational High-Availability Testing Guide

Ensure full system integrity during updates by running our standardized testing pipeline:

### Category A: REST Integration Tests
Create and run integration tests inside `/server/server.test.ts` to verify authentication boundaries:
```typescript
import { test, expect } from 'vitest';
import request from 'supertest';

test('Should prevent unauthenticated guest routes from reading school rosters', async () => {
  const result = await request('http://localhost:3000').get('/api/students');
  expect(result.status).toBe(401); // Requires JWT Authorization Headers
});
```

### Category B: Grade & Attendance Rule Validations
To verify domain constraint rules during updates, run verification scripts inside your development console:
```bash
# Runs standard typescript syntax compilation and checks index constraints
npm run lint
```

---

## 9. Cloud Relational Production Deployment Blueprint

This standard pipeline separates the static React UI frontend from the containerized Express backend:

```
[ GITHUB MAIN BRANCH ]
       |
       +-----------------------> [ CLIENT FRONTEND ]
       |                         Platform: Vercel Single-Page App CDN
       |                         Build: npm run build
       |                         Route: Serves index.html with static rewrite rules
       |
       +-----------------------> [ SERVER BACKEND ]
                                 Platform: Render / Railway Docker Container
                                 Build: Bundle CJS server using esbuild
                                 Store: Connects to managed High-Availability MySQL v8
```

### Step 1: Configure Your Environmental Keys (`.env.production`)
Create a production config file inside your deployment platform with standard, high-entropy secrets:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=bya_90827361_high_entropy_system_code_hash
DATABASE_URL=mysql://dbadmin:p@ssword@beta-mysql.railway.internal:3306/bethelhem_db
FRONTEND_URL=https://bethelhem-academy.vercel.app
```

### Step 2: Client SPA Deployment (Vercel Integration)
1.  Connect your GitHub repository to the Vercel console.
2.  Set the Framework preset to **Vite** or **Other**.
3.  Set the Build command to `vite build` and the output directory to `dist/`.
4.  Declare your environment variable `VITE_API_URL` pointing to your hosted API server domain.
5.  Enable clean SPA routing by adding the following redirects rule in `/public/vercel.json`:
    ```json
    { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
    ```

### Step 3: Server Container Deployment (Render / Railway Host)
1.  Import your repository link into Render as a **Web Service**.
2.  Set the Build command to `npm install` and the Start command to `npm start`.
3.  Verify the startup logs. Our `package.json` compiles the API server into a fast, self-contained `dist/server.cjs` file using **esbuild**:
    ```bash
    # Bundles the entire Express app into a optimized format to run on Port 3000
    npm run build
    ```
4.  Verify that your database URL allows incoming queries from your web server, and execute `server/seed_data.sql` to initialize your database structure.

Congratulations! Your Smart School Management System for **Bethelhem Youth Academy** is now fully configured, securely audited, and ready to serve your school community.
