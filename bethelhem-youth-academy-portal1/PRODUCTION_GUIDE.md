# Bethelhem Youth Academy — Production Integration & Deployment Manual

Welcome to the official, production-ready implementation catalog and deployment blueprint for the **Bethelhem Youth Academy Smart Portal**. This document maps the complete full-stack structure, relational database guidelines, system security boundaries, deployment actions, and quality assurance processes.

---

## 1. Final Production Folder Structure

A clean, modular separation of concerns between client components (SPA layer) and backend structures (Express controller layer) ensures isolated testing pipelines and simple container orchestration.

```
/
├── .env.example                # Shell template documenting sensitive secret variables
├── .gitignore                  # Exclusion patterns preventing secure/temp leaks
├── package.json                # Server & UI build configuration scripts
├── tsconfig.json               # Full-stack TypeScript compiler options
├── vite.config.ts              # Front-end bundler & assets proxy mapping
├── server.ts                   # Express controller framework & REST router
├── server/                     # Backend persistent storage configurations
│   ├── db.ts                   # Local mock/staging JSON database connection driver
│   ├── database.json           # Active development database (auto-seeded)
│   └── schema.sql              # Clean Schema DDL containing 16 tables & indexes
├── doc/                        # Technical specifications & checklists
│   └── API_SPEC.md             # Standard API endpoint definitions
└── src/                        # Client-side user interface (React v19)
    ├── main.tsx                # React virtual tree entry-point
    ├── index.css               # Global typography themes & Tailwind styles
    ├── types.ts                # Master TypeScript schemas & role definitions
    ├── services/
    │   └── api.ts              # Axios controller wrappers interfacing server commands
    └── components/
        ├── InfoHub.tsx         # Blueprint viewer & technical guide interface
        ├── Sidebar.tsx         # Responsive sidebar custom-rendered per user role
        ├── StudentDashboard.tsx# Records view, notifications panel, and report cards
        ├── TeacherDashboard.tsx# Attendance roster login & academic grade sheets
        ├── ParentDashboard.tsx # Child progress telemetry & notification summaries
        ├── AdminDashboard.tsx  # User account builder, database controllers
        └── admin/              # Specialized sections managed by administrative personnel
            ├── StudentsTab.tsx # Student creation forms, profiles, & details
            ├── TeachersTab.tsx # Teacher registrations & specialization forms
            ├── ParentsTab.tsx  # Parent identity & student-relation links
            ├── TimetableTab.tsx# Class section calendars, times slot matrices
            ├── AnnouncementsTab.tsx # Public bulletin creator, draft manager
            └── ReportsTab.tsx  # Analytics dashboard, scores leaderboard, printable rosters
```

---

## 2. Security Improvements

To shield Bethelhem Youth Academy's student and parent identities, apply these industry-standard security mitigations inside the production Express server:

### A. Environment Separation & CORS
Strictly whitelist client applications to prevent Cross-Origin Request forgery.
```ts
// server.ts
import cors from 'cors';
import helmet from 'helmet';

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://bethelhem-academy.vercel.app']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Rejected by Cross-Origin Resource Sharing policy'));
    }
  },
  credentials: true
}));
```

### B. Header Hardening (Helmet)
Configure content policy headers to prevent clickjacking, protocol downgrades, and XSS style injections.
```ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...allowedOrigins]
    }
  }
}));
```

### C. JWT Storage & Transport Policies
* **Payload Isolation**: Never store plaintext passwords or roles inside local state.
* **Cookie-Based JWT Option**: For production, transition JWT transport from localStorage to `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
```ts
res.cookie('bya_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

### D. Multi-Tier Role Authenticator Middleware
Enforce declarative verification scopes for every action:
```ts
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Fenced Action: Unauthorized user role.' });
    }
    next();
  };
};

// Usage
app.post('/api/grade-approvals', authenticateToken, authorizeRoles('admin'), (req, res) => { ... });
```

---

## 3. Performance Optimization

Enforcing rapid pageload times is critical for local networks in Addis Ababa. Implement the following optimization guidelines:

### A. Server GZIP/Brotli Compression
Compress response payloads of JSON API segments to slash loading delays over low-bandwidth client systems:
```bash
npm install compression
```
```ts
import compression from 'compression';
app.use(compression());
```

### B. Database Query Optimizer & Indexing
When transitioning from the JSON file system simulation to a live MySQL setup, add functional B-Tree indices:
```sql
CREATE INDEX idx_grades_lookup ON grades (student_id, quarter_id, academic_year_id);
CREATE INDEX idx_attendance_date ON attendance (class_id, date_logged, session_period);
```

### C. Client Asset Split (React Route Lazy Loading)
Lazy-load individual view pages to optimize initial bundle sizes:
```tsx
import { lazy, Suspense } from 'react';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));

// In render
<Suspense fallback={<div className="font-mono text-center text-xs text-slate-400 p-12">Bootstrapping view terminal...</div>}>
  <Routes>
     <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

---

## 4. Error Handling Improvements

A reliable production interface translates errors into user-friendly notices without exposing database execution paths.

### A. Centralized Express Exception Catch-All
Incorporate an unified error interceptor at the tail end of your Express server:
```ts
// Custom Operational Error Object
export class ApplicationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Express global middleware error interceptor
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.statusCode || 500;
  const devMessage = process.env.NODE_ENV !== 'production' ? err.stack : undefined;
  
  console.error(`[API ERROR] [${req.method}] ${req.url} — Status: ${status} — Msg: ${err.message}`);
  
  res.status(status).json({
    success: false,
    error: err.message || 'The terminal encountered an unexpected database aberration.',
    stack: devMessage
  });
});
```

### B. Client-Side Error Boundaries
Frame custom component grids in React crash boundaries to avoid page-wide blanking during intermittent rendering bugs:
```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary intercepted crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-2">
          <p className="font-bold text-rose-800">Element Rendering Interrupted</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-xs text-indigo-650 hover:underline">
            Retry panel reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 5. API Documentation

Our API conforms strictly to REST structures. It validates inputs and always issues responses as serialized JSON object payloads.

### Standard Resource Interfaces
For detailed REST endpoints mappings, request schemas, parameters list, and responsive JSON models, consult the complete specification page at **`/src/components/InfoHub.tsx`** or load the API schema panel directly from **`Specs & Blueprint`** in your panel view sidebar.

### Central REST Route Registry

| HTTP Method | Route Endpoint | Target Controller Purpose | Access Rights Scope |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Validates credentials and generates access token | Public |
| **GET** | `/api/auth/me` | Fetches active session profile context | Authenticated |
| **GET**| `/api/stats` | Aggregates system metrics (Total pupils, attendance, averages) | Admin / Teacher |
| **GET** | `/api/students` | Queries all registered student records with query filters | Admin / Teacher / Parent |
| **POST** | `/api/students` | Inserts and seeds standard student identity profiles | Admin Only |
| **GET** | `/api/attendance` | Returns presence ratios filtered by Section / Date / Period | Authenticated |
| **POST** | `/api/attendance` | Logs double attendance presence records | Admin / Teacher |
| **GET** | `/api/assessments` | Compiles evaluation score indexes per course structure | Authenticated |
| **POST** | `/api/assessments` | Issues academic grades out of 100% | Admin / Teacher |
| **POST** | `/api/grade-approvals` | Logs scores under `Pending` status review | Teacher Only |
| **PATCH**| `/api/grade-approvals/:id` | Publishes or rejects parent-facing grades | Admin Only |
| **GET** | `/api/report-card` | Compiles cumulative grades and remarks | Authenticated |

---

## 6. Deployment Guide

Our architecture allows separate or bundled production deployments. Below is the dual-target guide for deploying to **Vercel** and **Render / Railway**:

```
+-----------------------------------+        +-----------------------------------+
|          Vercel Client            |        |      Render / Railway Server      |
|                                   |        |                                   |
|   - Serves React SPAs             | -----> |   - Runs Express controller       | -----> MySQL DB
|   - Injects VITE_API_URL          |        |   - Parses routes & secures JWT   |
|                                   |        |                                   |
+-----------------------------------+        +-----------------------------------+
```

### A. Frontend Deploy (Vercel Client)
1. Fork or import your repository connection into GitHub.
2. In Vercel, select **Create a New Project** and connect your repo.
3. Configure the **Build Settings**:
   * **Framework Preset**: `Vite` OR `Other`
   * **Build Command**: `vite build`
   * **Output Directory**: `dist`
4. Declare your Environment variables in the project setup console:
   * `VITE_API_URL` = `https://bethelhem-api-server.onrender.com` (Your backend target route)
5. Hit **Deploy**. Set up custom redirects in your `/public/vercel.json` to enable clean routing in client SPA layouts:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### B. Backend Container Deploy (Render / Railway Host)
1. In Render, select **New Web Service** and select your GitHub repository.
2. Direct the settings parameters:
   * **Environment Node**: `Node` or choose modern Dockerfile
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start` (Runs standalone `dist/server.cjs` bundled by `esbuild`)
3. Populate the Environment panel values:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = `[RandomLongHashStringCode]`
   * `DATABASE_URL` = `mysql://user:pass@mysqlhost:3306/bethelhem_db` (Production database target)
   * `PORT` = `3000`
4. Confirm changes. The platform will boot, launch the express controller port, and begin serving the secure REST paths.

---

## 7. MySQL Setup Guide

Below is the production-tested, fully normalized relational blueprint designed specifically to satisfy Bethelhem Youth Academy's academic structure:

```sql
-- BETHELHEM YOUTH ACADEMY PRODUCTION SCHEMA
-- TARGET: MySQL v8.0+
-- Relational Integrity Constraints with Cascades

CREATE DATABASE IF NOT EXISTS bethelhem_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bethelhem_db;

-- 1. CHRONOLOGIES GROUP
CREATE TABLE academic_years (
  id VARCHAR(50) PRIMARY KEY,
  year_name VARCHAR(100) NOT NULL, -- e.g., "2026/2027 E.C."
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quarters (
  id VARCHAR(50) PRIMARY KEY,
  academic_year_id VARCHAR(50) NOT NULL,
  quarter_name VARCHAR(50) NOT NULL, -- e.g., "Quarter 1", "Quarter 2"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

-- 2. ACCOUNTS / IDENTITY MEMBERS GROUP
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(150),
  role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parents (
  user_id VARCHAR(50) PRIMARY KEY,
  phone_no VARCHAR(50) NOT NULL,
  occupation VARCHAR(100),
  office_phone VARCHAR(50),
  emergency_contact VARCHAR(150),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE teachers (
  user_id VARCHAR(50) PRIMARY KEY,
  phone_no VARCHAR(50) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  hire_date DATE,
  isActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. SCHOOL STRUCTURAL MAPS
CREATE TABLE sections (
  id VARCHAR(50) PRIMARY KEY,
  room_no VARCHAR(50) NOT NULL,
  grade INT NOT NULL CHECK (grade BETWEEN 1 AND 8), -- Restricts grade level strictly
  section_name ENUM('A', 'B', 'C') NOT NULL DEFAULT 'A', -- Restricts letter designations
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE subjects (
  id VARCHAR(50) PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL, -- e.g., "Mathematics", "Amharic", "English"
  subject_code VARCHAR(30) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Syllabus maps: dynamic courses per grade level
CREATE TABLE grade_subjects (
  grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 8),
  subject_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (grade_level, subject_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 4. STUDENT AND RELATIONS
CREATE TABLE students (
  user_id VARCHAR(50) PRIMARY KEY,
  registration_no VARCHAR(50) NOT NULL UNIQUE,
  parent_id VARCHAR(50) NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  enrollment_date DATE,
  isActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(user_id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- 5. ATTENDANCE TRAILING LOGS
CREATE TABLE attendance (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  class_id VARCHAR(50) NOT NULL,
  date_logged DATE NOT NULL,
  session_period ENUM('morning', 'afternoon') NOT NULL, -- Double attendance restriction
  status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL DEFAULT 'Present',
  logged_by_id VARCHAR(50),
  UNIQUE KEY unique_attendance_session (student_id, date_logged, session_period),
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES sections(id),
  FOREIGN KEY (logged_by_id) REFERENCES users(id)
);

-- 6. GRADE & WORKFLOW TRACKING
CREATE TABLE grades (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  quarter_id VARCHAR(50) NOT NULL,
  academic_year_id VARCHAR(50) NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  max_marks INT NOT NULL DEFAULT 100,
  is_pass BOOLEAN GENERATED ALWAYS AS (marks_obtained >= (max_marks * 0.5)) STORED, -- Standard 50% Threshold check
  graded_by_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (quarter_id) REFERENCES quarters(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (graded_by_id) REFERENCES users(id)
);

-- Grade publish queue gateway module
CREATE TABLE grade_approvals (
  id VARCHAR(50) PRIMARY KEY,
  grade_id VARCHAR(50) NOT NULL UNIQUE,
  approval_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by_id VARCHAR(50),
  remarks TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);

-- Conduct tracker
CREATE TABLE conduct (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  quarter_id VARCHAR(50) NOT NULL,
  academic_year_id VARCHAR(50) NOT NULL,
  conduct_grade ENUM('A', 'B', 'C') NOT NULL DEFAULT 'A', -- A=Excellent, B=Good, C=Needs Improvement
  remarks TEXT,
  assigned_by VARCHAR(50) NOT NULL,
  UNIQUE KEY unique_conduct (student_id, quarter_id, academic_year_id),
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (quarter_id) REFERENCES quarters(id),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- 7. EVENTS AND COMMUNICATIONS SHEETS
CREATE TABLE announcements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_audience ENUM('All', 'Teachers', 'Parents', 'Students') NOT NULL DEFAULT 'All',
  publication_status ENUM('Published', 'Draft') NOT NULL DEFAULT 'Published',
  posted_by_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE timetables (
  id VARCHAR(50) PRIMARY KEY,
  section_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  teacher_id VARCHAR(50) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
  period_start_time TIME NOT NULL,
  period_end_time TIME NOT NULL,
  classroom_no VARCHAR(30),
  UNIQUE KEY unique_schedule_slot (section_id, day_of_week, period_start_time),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(user_id)
);

CREATE TABLE teacher_assignments (
  teacher_id VARCHAR(50) NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  academic_year_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (teacher_id, section_id, subject_id, academic_year_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(user_id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

---

## 8. Production Configurations

Maintain a secure, robust environment with proper process management and configuration templates.

### A. Environment Configuration File (`.env.production`)
Never commit active credentials to source control. Set up your cloud project manager settings using this guide:
```env
# Server Ingress Settings
PORT=3000
NODE_ENV=production

# Security Keys configurations
JWT_SECRET=bya_system_secure_hash_8792837372_academy
JWT_EXPIRATION=24h

# High-Availability Database Connection parameters
DATABASE_HOST=bethelhem-mysql-cluster.railway.internal
DATABASE_PORT=3306
DATABASE_USER=academy_db_admin
DATABASE_PASS=P@ssword_For_BYA_Secure_Cloud
DATABASE_NAME=bethelhem_db

# Whitelisted Clients URL
FRONTEND_URL=https://bethelhem-academy-portal.vercel.app
```

### B. Node Server Daemon (PM2 Process Cluster Mapping)
Using **PM2** ensures automatic server recovery following crashes or unexpected exceptions. Create an `ecosystem.config.js` file at your root directory:
```javascript
module.exports = {
  apps: [{
    name: "bya-smart-server",
    script: "./dist/server.cjs",
    instances: "max", // Enables clustering mode balancing load among available cores
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "800M",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
```

---

## 9. Testing Guide

Ensure complete application integrity before code merges by adopting these testing patterns:

### A. Automatic REST API Unit Tests
We use **Vitest** paired with **Supertest** to test authentication loops and validation layers:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
// import { apiRouter } from './server';

describe('Smart School API integration checks', () => {
  it('Should block unauthorized queries from accessing student roster catalogs', async () => {
    const response = await request('http://localhost:3000')
      .get('/api/students')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401); // Requires JWT Authenticity Bearer Token
  });

  it('Should allow user login with registered credentials', async () => {
    const loginPayload = { username: 'admin', password: 'password' };
    const response = await request('http://localhost:3000')
      .post('/api/auth/login')
      .send(loginPayload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.role).toBe('admin');
  });
});
```

### B. CI/CD Pipeline Automation (GitHub Actions Blueprint)
Establish automated pipeline checks in `.github/workflows/continuous-integration.yml`:
```yaml
name: System Integrity Code Checks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate_codebase:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Initialize Node Runtime Environment
      uses: actions/setup-node@v3
      with:
        node-node: 18.x
        cache: 'npm'

    - name: Resolve Project Dependencies
      run: npm ci

    - name: Audit Compiler Status (TypeScript lint check)
      run: npm run lint

    - name: Assemble Distribution Package (Production Compiler Build)
      run: npm run build
```

---

## 10. User Acceptance Testing (UAT) Guide

To formally certify system readiness before presenting the product to Bethelhem Youth Academy board representatives, conduct this comprehensive four-role validation script:

### 🎭 Dashboard 1: Administrative Officer Verification Script
1. **User Login**: Log into the application using credential details of username `admin` / password `password`. Verify the secure redirect into the administrative landing grid.
2. **Student Identity Onboarding**: Navigate to the **Admin Dashboard** and select **Students**. Fill out the Student registration form with student profiles, then hit submit. Verify that registration details appear immediately.
3. **Draft Academic Bulletins**: Under the **Specs & Blueprint** header, select the **Announcements** tab. Create an announcement targeted at "Parents Only". Save it as a "Draft". Confirm that the dashboard flags it as a "Draft File" and that it is hidden from parents.
4. **Publish Grades Review**: Go to the **Grade Approvals** panel. Review a pending draft grade submitted by a teacher. Approve the entry. Check that the standing shifts from `Pending` status to `Approved`.

### 🎭 Dashboard 2: Certified Teacher Verification Script
1. **User Login**: Sign out and log in using credential details of username `teacher` / password `password`.
2. **Attendance Tracker**: Open the classroom dashboard tracker. Select Class level `3A`. Tap "Present" on student names. Submit the card. Reload the screen to verify that inputs saved successfully in the relational schema.
3. **Submit Academic Evaluations**: Click on the grades input panel. Log test results for spelling assessments. Enter grades out of 100%. Verify that the system automatically calculates the pass status using the 50% GPA boundary.
4. **Schedule Timetables**: View the assigned timetables sheet to verify that section courses do not clash with other slots.

### 🎭 Dashboard 3: Student Verification Script
1. **User Login**: Log into the terminal using credential details of username `student` / password `password`.
2. **Academic Transcripts**: Review your personal grades card. Validate that approved assessments display correctly, whereas pending evaluations remain hidden.
3. **Attendance Cards Check**: Access the personalized attendance calendar view. Confirm that the status breakdown matches the days logged.
4. **Read Bulletin Board**: Verify that active announcements targeting students or "All Audiences" are listed on the informational bulletin board.

### 🎭 Dashboard 4: Parent Verification Script
1. **User Login**: Sign into the dashboard using credential details of username `parent` / password `password`.
2. **Progress Telemetry Tracker**: View the child performance charts and median metrics. Confirm that overall scores match approved items.
3. **Report Cards Generation**: Open the **Reports & Analytics Compile** panel. Generate a printable PDF report card. Verify that the printable format fits cleanly onto a single A4 page with appropriate styling.
4. **Presence Census Records**: Read the child's attendance statistics. Open the notifications drawer to review active announcements. Mark them as read.

---

### Certification Confirmation Checklist

* [ ] Full-stack compiler runs cleanly without typescript or build output warnings.
* [ ] Database models and keys obey the 1-to-8 Grade Constraints and Double Session attendance checks.
* [ ] Security headers prevent cross-site scripting and unauthorized URL routing.
* [ ] Performance configurations compress active data streams.
* [ ] Printable report card formats have beautiful typography and adjust for clean page cuts when printed or printed to PDF.

For real-time code execution, you can preview the system live using the **Specs & Blueprint** option in the app dev panel interface view. Congratulations on successfully shipping Bethelhem Youth Academy's Smart Portal!
