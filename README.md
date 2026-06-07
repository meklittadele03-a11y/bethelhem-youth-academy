# Bethelhem Youth Academy Smart School Management Portal

An integrated full-stack administrative and academic portal designed to support Bethelhem Youth Academy (Grade 1-8). This application simplifies communication, grading workflows, and attendance tracking between administrators, teachers, students, and parents.

Build on a modern software architecture, the portal streamlines school operations by enforcing strict data validation, dual-session attendance tracking, and administrative grade approvals.

---

## 🎯 Project Overview & Purpose

Educational institutions in developing regions often struggle with manual record keeping and paper-filled processes. Bethelhem Youth Academy Smart Portal digitizes this ecosystem, helping staff focus on teaching rather than bookkeeping.

### Target User Roles
1. **Administrative Officers (Admins)**: Oversee operations, manage user accounts, coordinate classroom period timetables, publish public bulletins, and review grades before final publication.
2. **Certified Teachers (Instructors)**: Track double-session daily active presence (morning and afternoon), manage course grades, specify behavioral conduct logs, and submit grade sheets for administrative approval.
3. **Student Cohort (Pupils)**: View certified grade reports, view timetables, and monitor personal attendance trends.
4. **Parents / Guardians**: Track multiple siblings, view academic performance, download PDF/print-ready transcripts, and monitor behavioral indicators from teachers.

---

## ✨ Features Key Module Highlights

* **Double Attendance Tracking**: Morning check-in and afternoon check-out are logged separately to manage split days and transportation needs.
* **Administrative Approval Gate**: Teachers submit grades as draft entries which must be audited and approved by an admin before students or parents can see them.
* **Grade Book Calc & Tracking**: Full homework and exam trackers that automatically compute pass/fail statuses based on local guidelines (50% passing mark).
* **Behavior & Conduct Logs**: Teachers assess classroom behavior status (Excellent/Good/Needs Improvement) paired with qualitative commentary.
* **Dynamic PDF & Printable Cards**: Parents and teachers can view and print single-page A4 certified progress report cards with auto-summarized parameters.
* **Timetables & Conflict Detection**: Solves room or scheduling conflicts by evaluating day of week, room, teacher availability, and time blocks.

---

## ⚙️ Tech Stack & Architecture

- **Frontend**: React 18 / v19 SPA, TypeScript, Tailwind CSS, Lucide icons, Motion (Framer Motion)
- **Backend API Server**: Node.js, Express, TypeScript (transpiled to CommonJS via `esbuild`)
- **Database Engine**: Relational model schema mapped through `database.json` JSON DB storage representing real production MySQL structures
- **Tooling**: Vite, tsx tool runtime, ESLint

---

## 📂 Project Structure

```
├── assets/                     # Diagnostic assets and logos
├── server/                     # Backend models, routes, and JSON DB layers
│   ├── config/                 # Configurations (DB & auth keys)
│   ├── controllers/            # API request controller blocks
│   ├── middleware/             # Role verification & JWT validations
│   ├── models/                 # Database entity model hooks
│   ├── routes/                 # Express backend endpoints mapping
│   ├── schema.sql              # Clean SQL relational database definitions
│   └── database.json           # Local simulation storage engine
├── src/                        # React Frontend Core
│   ├── components/             # React views and dashboard components
│   │   └── admin/              # Module-specific admin tabs
│   ├── context/                # Global AuthContext providers
│   ├── services/               # Axios API client requests configuration
│   ├── App.tsx                 # Main client entry with routing gates
│   └── main.tsx                # Client bundle mount point
├── server.ts                   # Express server entry point (Vite dev middleware server)
└── package.json                # Dependencies and project run-scripts
```

---

## 🔧 Installation & Verification Guide

Follow these simple steps to set up the Bethelhem Academy Portal on your municipal workspace:

### 1. Prerequisite Installations
Ensure you have the following installed on your target machine:
- **Node.js**: v18.x or v20.x stable recommended
- **NPM**: Standard package manager
- **MySQL Server** (Optional for local default representation config): v8.0+

### 2. Setup the Codebase
Clone the project repository and navigate into the workspace directory:
```bash
git clone https://github.com/your-repo/bethelhem-academy-portal.git
cd bethelhem-academy-portal
```

### 3. Install Dependencies
Run npm installations to load node modules:
```bash
npm install
```

### 4. Create Local Seed Files
Generate local simulation data by running the dataset generator script:
```bash
node scripts/generate_seed_data.js
```

### 5. Launch the Development Server
Launch both the Express backend API and the Vite frontend compiler concurrently on Port 3000:
```bash
npm run dev
```
Open **`http://localhost:3000`** on your browser to start exploring!

---

## 🔑 Demo Access Credentials
Please refer to the separate text sheet `SYSTEM_CREDENTIALS.txt` at the root folder for sample login credentials across all user roles.

---

## 🚀 Future Academic Extensions
If you are planning to extend this research project, some recommended modules are:
- **Real-time SMS Push**: Incorporate Twilio gateways to message critical alerts directly to registered parents about missed attendance.
- **Academic Analytics Engine**: Implement standard D3 or ChartJS widgets reporting relative performance benchmarks across courses inside sections.
- **Electronic Fee Ledger**: Add straightforward invoice registers tracking quarterly tuition payments.
