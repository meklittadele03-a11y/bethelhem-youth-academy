import React, { useState } from 'react';
import { 
  Database, 
  FolderTree, 
  Terminal, 
  Rocket, 
  BookOpen, 
  Settings, 
  FileText,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function InfoHub() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'folders' | 'mysql' | 'install' | 'roadmap'>('architecture');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const folderStructureString = `/.env.example             # Configuration templates
/.gitignore               # File exclusions
/index.html               # Main entry HTML
/metadata.json            # AI Studio app metadata
/package.json             # Service and package manifest
/server.ts                # Express backend & dynamic router
/tsconfig.json            # TypeScript configuration
/vite.config.ts           # Bundler rules and file watching
/server/
  ├── db.ts               # Local relational database simulation engine
  ├── database.json       # Live JSON data-store state (auto-seeded)
  └── schema.sql          # Production MySQL schema DDL & indexes
/src/
  ├── main.tsx            # React client mount path
  ├── index.css           # Global typography & Tailwind styles
  ├── App.tsx             # Route management & auth gateway
  ├── types.ts            # Type definitions (User, Profile, Grade, Class)
  ├── services/
  │   └── api.ts          # Axios controllers for Express endpoints
  └── components/
      ├── InfoHub.tsx     # Technical blueprint & reference documentation
      ├── Sidebar.tsx     # Unified menu controls per logged-in role
      ├── AdminDashboard.tsx   # Administration management controls
      ├── TeacherDashboard.tsx # Grade entering & Attendance matrices
      ├── StudentDashboard.tsx # Grades transcript & Attendance cards
      └── ParentDashboard.tsx  # Student progress & notifications tracker`;

  const installInstructions = `# Step 1: Clone or extract project repository files
git clone <repository-url>
cd bethelhem-academy-portal

# Step 2: Install full-stack dependencies
npm install

# Step 3: Set up environment parameters
cp .env.example .env
# Edit .env and supply your preferred JWT_SECRET and MySQL credentials

# Step 4: Run the integrated development server (Runs Express & Vite on Port 3000)
npm run dev

# Step 5: Clean and build the production bundle
npm run build

# Step 6: Spawn standalone production container
npm run start`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">System Blueprints & Guides</h2>
            <p className="text-xs text-slate-500">Bethelhem Youth Academy Core Framework & Setup Hub</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'architecture', label: 'Architecture', icon: Settings },
            { id: 'folders', label: 'File Tree', icon: FolderTree },
            { id: 'mysql', label: 'MySQL Schema', icon: Database },
            { id: 'install', label: 'Installation', icon: Terminal },
            { id: 'roadmap', label: 'Roadmap', icon: Rocket },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  active 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Multi-User Hybrid MVC Architecture</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Bethelhem Youth Academy Smart Portal relies on a modern, robust, full-stack MVC layout. In development and review, a high-speed relational simulator runs out of <code className="bg-slate-100 font-mono text-xs px-1.5 py-0.5 rounded text-rose-600">server/db.ts</code>, handling instant in-memory CRUD operations while writing state directly into a JSON database file in real-time. This provides a live, interactive database without requiring a local mysql service startup. For production execution, the system can instantly hook into a live <strong>MySQL Server</strong> simply by updating the variables in your <code className="bg-slate-100 font-mono text-xs px-1.5 py-0.5 rounded">.env</code>.
              </p>
            </div>

            {/* Architecture Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-100 rounded-xl p-4 bg-emerald-50/30">
                <div className="font-bold text-xs text-emerald-800 uppercase mb-1">1. Frontend Layer (View)</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  React 19 structured with Tailwind CSS utility classes and Lucide icons. Operates a stateful dashboard reflecting the respective permissions of different Roles.
                </p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4 bg-indigo-50/30">
                <div className="font-bold text-xs text-indigo-800 uppercase mb-1">2. Express Layer (Controller)</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  REST endpoints secured by jsonwebtoken-based middleware. Coordinates user logins, routes attendance data, and registers student credentials from school forms.
                </p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4 bg-amber-50/30">
                <div className="font-bold text-xs text-amber-800 uppercase mb-1">3. Relational Layer (Model)</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Relational table schema representing classes, sub-profiles, attendance, and academics. Interstellar design that translates immediately into standardized MySQL queries.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800 block mb-1">Key High-Reliability Features implemented:</strong>
                - Full session retention with modern Client JWT Authentication stored in <code className="font-mono text-slate-700 bg-slate-200/50 px-1 rounded">localStorage</code>.<br />
                - Live state preservation saving attendance and test marks into a sandbox data file database.<br />
                - Clean separation of concerns between client modules <code className="font-mono text-slate-700">/src/*</code> and Express MVC endpoints <code className="font-mono text-slate-700">/server.ts</code>.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOLDER STRUCTURE */}
        {activeTab === 'folders' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Project File Layout</h3>
              <button 
                onClick={() => copyToClipboard(folderStructureString, 'folders')}
                className="text-xs flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText === 'folders' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto leading-relaxed h-80 shadow-inner">
              {folderStructureString}
            </pre>
          </div>
        )}

        {/* TAB 3: MYSQL SCHEMA */}
        {activeTab === 'mysql' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Production MySQL Schema DDL (16 Tables)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fully normalized, relational MySQL schema designed specifically for the academic and security mandates of Bethelhem Youth Academy.
                </p>
              </div>
              <button 
                onClick={() => copyToClipboard(`-- Standard compilation query to rank pupils within their section
SELECT 
  u.full_name AS Student_Name,
  sec.grade AS Grade,
  sec.section_name AS Section,
  sub.subject_name AS Subject,
  g.score AS Score,
  DENSE_RANK() OVER (
    PARTITION BY s.section_id, g.subject_id, g.quarter_id, g.academic_year_id 
    ORDER BY g.score DESC
  ) AS Class_Rank
FROM grades g
JOIN users u ON g.student_id = u.id
JOIN students s ON s.user_id = u.id
JOIN sections sec ON s.section_id = sec.id
JOIN subjects sub ON g.subject_id = sub.id
WHERE g.quarter_id = 'q-1' AND g.academic_year_id = 'ay-2025-2026'
ORDER BY sec.grade, sec.section_name, sub.subject_name, Class_Rank;`, 'rankQuery')}
                className="self-start md:self-auto text-xs flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl font-semibold border border-emerald-100 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText === 'rankQuery' ? 'Copied Rank SQL!' : 'Copy Rank Query'}
              </button>
            </div>

            {/* Core Relational Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-4 bg-emerald-50/20">
                <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wide mb-2">School & Academic Constraints</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li><strong>Grade Restrictions:</strong> Enforced via checked integers <code className="bg-emerald-100/60 text-emerald-800 px-1 rounded font-mono">1 to 8</code> on the <code className="font-mono bg-emerald-100/60 text-emerald-800 px-1 rounded">sections</code> and <code className="font-mono bg-emerald-100/60 text-emerald-800 px-1 rounded">grade_subjects</code> tables.</li>
                  <li><strong>Physical Sections:</strong> Enumerated to strictly <code className="bg-emerald-100/60 text-emerald-800 px-1 rounded font-mono font-bold">A, B, C</code> (e.g. 1A, 1B, 1C to 8A, 8B, 8C).</li>
                  <li><strong>Subjects Divergence:</strong> Supported by intermediate <code className="font-mono font-bold">grade_subjects</code> mapping. Grade-specific syllabi are assigned dynamically.</li>
                  <li><strong>10-Month Calendar:</strong> Enforced by active calendars in <code className="font-mono text-emerald-800 bg-emerald-100/60 px-1 rounded">academic_years</code> linked to exactly 4 distinct grading quarters.</li>
                </ul>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-indigo-50/20">
                <h4 className="font-bold text-xs text-indigo-800 uppercase tracking-wide mb-2">Workflow & Verification Routines</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li><strong>Double Attendance Session:</strong> Daily monitoring has a composite key on <code className="font-mono text-indigo-800">(student_id, date, session)</code> allowing separate <strong>morning</strong> and <strong>afternoon</strong> presence.</li>
                  <li><strong>Grading Pass Criteria:</strong> Enforced naturally at <code className="font-bold text-indigo-800 font-mono">&gt;= 50%</code> via a MySQL database <code className="bg-indigo-100/60 px-1 rounded font-mono text-indigo-800 font-bold">GENERATED ALWAYS AS</code> stored computed column.</li>
                  <li><strong>Conduct Assessment:</strong> Graded strictly and stored as custom enums: <code className="font-mono font-bold text-indigo-800">A (Excellent), B (Good), C (Needs Improvement)</code>.</li>
                  <li><strong>Grade Approval Cycle:</strong> A designated <code className="font-mono text-indigo-800 bg-indigo-100/60 px-1 rounded">grade_approvals</code> table acts as the gateway. Teachers enter scores as <code className="text-amber-700 font-bold">Pending</code>, visible on parent report cards only after Admin approves.</li>
                </ul>
              </div>
            </div>

            {/* List of 16 Tables */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Database Tables Reference ({'16 tables defined'})</h4>
              </div>
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {[
                  { name: 'academic_years', type: 'Chronology', desc: 'Registers the 10-month school year boundaries with active year flags.' },
                  { name: 'quarters', type: 'Chronology', desc: 'Maintains timeline limits for each of the 4 standard grading quarters.' },
                  { name: 'users', type: 'Security Identity', desc: 'Identity core with password hashes, email targets, logins, and system roles (admin, teacher, student, parent).' },
                  { name: 'parents', type: 'Profiles Extension', desc: 'Stores parent-specific records, including contact physical addresses and occupations.' },
                  { name: 'teachers', type: 'Profiles Extension', desc: 'Profiles academic specializations, hire periods, and professional biographies.' },
                  { name: 'sections', type: 'Structure Mapping', desc: 'Classrooms restricted strictly to Grade 1 to 8, with section letters A, B, C.' },
                  { name: 'subjects', type: 'Structure Mapping', desc: 'Global catalog mapping standard materials (e.g. Math, Science, Amharic).' },
                  { name: 'grade_subjects', type: 'Relationship Junction', desc: 'Maps which subjects are taught at which grade levels, solving curriculum variance.' },
                  { name: 'students', type: 'Profiles Extension', desc: 'Central student profile registry linking users back to their respective sections and parents.' },
                  { name: 'attendance', type: 'Daily Assessment', desc: 'Log registry, tracking morning and afternoon presence status separately.' },
                  { name: 'grades', type: 'Academic Performance', desc: 'Scores out of 100%, incorporating automated check constraints and pass computations.' },
                  { name: 'grade_approvals', type: 'Workflow Pipeline', desc: 'Enforces pre-check boundaries. Controls scores before publishing.' },
                  { name: 'conduct', type: 'Behavior Tracker', desc: 'Monitors student conduct grades (A = Excellent, B = Good, C = Needs Improvement) per term.' },
                  { name: 'announcements', type: 'Shared Broadcast', desc: 'Information board tracking public updates targeted to specific user roles.' },
                  { name: 'timetables', type: 'Scheduling Node', desc: 'Maps section courses to days and timeframes, preventing room or schedule clashes.' },
                  { name: 'teacher_assignments', type: 'Relationship Junction', desc: 'Associates certified teachers with section courses and fields of study.' },
                ].map((item, index) => (
                  <div key={index} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/55 transition-colors">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded min-w-[140px] text-center border border-sky-100">
                      {item.name}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-900 text-xs text-slate-300 leading-relaxed font-mono relative">
              <div className="absolute top-3 right-3 text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-900">
                SQL PREVIEW
              </div>
              <span className="text-emerald-400 block mb-1">-- Demonstration of section-wise rank query using Window Functions</span>
              <span className="text-slate-400 block mb-2">-- Rank computed within section boundaries exclusively</span>
              <span className="text-sky-400">SELECT</span> u.full_name, sec.grade, sec.section_name, g.score,<br />
              &nbsp;&nbsp;<span className="text-pink-400">DENSE_RANK() OVER</span> (<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">PARTITION BY</span> s.section_id, g.subject_id, g.quarter_id<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">ORDER BY</span> g.score <span className="text-sky-400">DESC</span><br />
              &nbsp;&nbsp;) <span className="text-sky-400">AS</span> Class_Rank<br />
              <span className="text-sky-400">FROM</span> grades g<br />
              <span className="text-sky-400">JOIN</span> users u <span className="text-sky-400">ON</span> g.student_id = u.id<br />
              <span className="text-sky-400">JOIN</span> students s <span className="text-sky-400">ON</span> s.user_id = u.id<br />
              <span className="text-sky-400">JOIN</span> sections sec <span className="text-sky-400">ON</span> s.section_id = sec.id<br />
              <span className="text-sky-400">WHERE</span> g.quarter_id = <span className="text-amber-300">'q-1'</span>;
            </div>
          </div>
        )}

        {/* TAB 4: INSTALLATION */}
        {activeTab === 'install' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Setup Guide Terminal Block</h3>
                <p className="text-xs text-slate-500 mt-1">Standard command set for quick deployment in container sandboxes or local systems.</p>
              </div>
              <button 
                onClick={() => copyToClipboard(installInstructions, 'install')}
                className="text-xs flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText === 'install' ? 'Copied!' : 'Copy instructions'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl overflow-x-auto leading-relaxed shadow-inner">
              {installInstructions}
            </pre>
          </div>
        )}

        {/* TAB 5: ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Bethelhem Youth Academy Deployment Roadmap</h3>
            
            <div className="relative border-l-2 border-emerald-100 pl-6 ml-3 space-y-6">
              {[
                {
                  phase: 'Phase 1: Architecture & Foundations',
                  status: 'Completed',
                  desc: 'Initialize the full Express backend API layer, connect JWT session management, set up relational database files and structures, and deliver role-specific dashboards with customized local persistence triggers.'
                },
                {
                  phase: 'Phase 2: Management Modules Expansion',
                  status: 'Planned',
                  desc: 'Incorporate teacher assignment mechanisms, interactive course syllabus editors, class schedule planner matrices, dynamic calendar events lists, and student-to-student registration sheets.'
                },
                {
                  phase: 'Phase 3: Academic & Grade Analytics',
                  status: 'Planned',
                  desc: 'Formulate progress charts for math/english assessments, calculate grades according to strict 50% thresholds, and visualize performance benchmarks.'
                },
                {
                  phase: 'Phase 4: Parent Portal Communication',
                  status: 'Planned',
                  desc: 'Provide private teacher-parent messaging feeds, publish school report card bulletins, trigger direct notifications for student leaves, and support administrative board announcements.'
                }
              ].map((milestone, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                    milestone.status === 'Completed' 
                      ? 'bg-emerald-500 border-white shadow-sm ring-2 ring-emerald-100' 
                      : 'bg-white border-slate-300'
                  }`} />
                  <div>
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-xs text-slate-800">{milestone.phase}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        milestone.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
