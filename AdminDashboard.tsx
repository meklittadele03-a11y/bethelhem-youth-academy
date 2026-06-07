import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  School, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Building,
  UserPlus
} from 'lucide-react';
import { schoolService } from '../services/api';
import { ClassSection, StudentProfile } from '../types';
import TeachersTab from './admin/TeachersTab';
import StudentsTab from './admin/StudentsTab';
import AttendanceTab from './admin/AttendanceTab';
import GradesTab from './admin/GradesTab';
import ConductTab from './admin/ConductTab';
import TimetableTab from './admin/TimetableTab';
import AnnouncementsTab from './admin/AnnouncementsTab';
import ReportsTab from './admin/ReportsTab';
import SettingsTab from './admin/SettingsTab';
import { Check, X, ShieldAlert, BadgeInfo } from 'lucide-react';

interface AdminDashboardProps {
  activeSection: string;
}

export default function AdminDashboard({ activeSection }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [gradeApprovals, setGradeApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Student registration states
  const [showRegModal, setShowRegModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: 'Male',
    classId: '',
    parentId: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, studentsData, classesData, teachersData, parentsData, approvalsData] = await Promise.all([
        schoolService.getStats(),
        schoolService.getStudents(),
        schoolService.getClasses(),
        schoolService.getTeachers(),
        schoolService.getParents(),
        schoolService.getGradeApprovals()
      ]);

      setStats(statsData);
      setStudents(studentsData);
      setClasses(classesData);
      setTeachers(teachersData);
      setParents(parentsData);
      setGradeApprovals(approvalsData || []);

      // Pre-populate defaults for the form if lists are ready
      if (classesData.length > 0 && parentsData.length > 0) {
        setRegForm(prev => ({
          ...prev,
          classId: classesData[0].id,
          parentId: parentsData[0].userId
        }));
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveGrade = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await schoolService.updateGradeApprovalStatus(id, status);
      // Reload matching status
      const [updatedApprovals, updatedStats, updatedStudents] = await Promise.all([
        schoolService.getGradeApprovals(),
        schoolService.getStats(),
        schoolService.getStudents()
      ]);
      setGradeApprovals(updatedApprovals || []);
      setStats(updatedStats);
      setStudents(updatedStudents);
    } catch (err) {
      console.error('Failed to update grade approval status', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegForm(prev => ({ ...prev, [name]: value }));
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!regForm.fullName || !regForm.email || !regForm.dob) {
      setErrorMsg('Please supply all required * fields.');
      return;
    }

    try {
      await schoolService.registerStudent(regForm);
      setSuccessMsg(`Student "${regForm.fullName}" registered successfully with random registration key.`);
      
      // Reset form (except structural selectors)
      setRegForm(prev => ({
        ...prev,
        fullName: '',
        email: '',
        password: '',
        phone: '',
        dob: ''
      }));

      // Reload dataset
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete registration.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Handle viewing specific subsections based on Sidebar section choice
  const viewSection = activeSection === 'overview' ? 'overview' : activeSection;

  return (
    <div className="space-y-6">
      {/* 1. OVERVIEW: STATS CARDS */}
      {viewSection === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Control Deck</h2>
            <p className="text-xs text-slate-500 mt-1">Bethelhem Youth Academy administrative and resource statistics overview.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Educators', value: stats?.totalTeachers || 0, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Active Classes', value: stats?.totalClasses || 0, icon: School, color: 'text-amber-600 bg-amber-50' },
              { label: 'Offered Course Subjects', value: stats?.totalSubjects || 0, icon: BookOpen, color: 'text-sky-600 bg-sky-50' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block tracking-wide uppercase">{card.label}</span>
                    <strong className="text-3xl font-extrabold text-slate-800 tracking-tight block mt-2">{card.value}</strong>
                  </div>
                  <div className={`p-4 rounded-2xl ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info & Welcome Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full uppercase">Term Info</span>
                <h3 className="text-2xl font-extrabold tracking-tight mt-4">2026 Academic Session Active</h3>
                <p className="text-xs text-emerald-100/95 mt-2 leading-relaxed">
                  Daily attendance logs, mid-term testing reports, and registrations are actively online. Grade boundaries are calculated based on national standards.
                </p>
              </div>
              <div className="text-[10px] font-mono text-emerald-200 mt-4">
                Bethelhem Youth Academy · Addis Ababa, Ethiopia
              </div>
            </div>

            {/* Admin roster preview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4">Class Distribution Summary</h3>
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {cls.section}
                      </div>
                      <div>
                        <strong className="text-xs text-slate-800">{cls.className}</strong>
                        <p className="text-[10px] text-slate-400">{cls.roomNo}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      {cls.studentCount} Students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Grade Approvals Desk */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  Grade Entry Approvals Workflow
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Approve, reject or review academic grades submitted by subject teachers.</p>
              </div>
              <span className="bg-amber-50 text-amber-700 font-bold font-mono text-[9px] px-2.5 py-1 rounded-full uppercase">
                {gradeApprovals.filter(g => g.status === 'Pending').length} Pending Requests
              </span>
            </div>

            {gradeApprovals.filter(g => g.status === 'Pending').length === 0 ? (
              <div className="p-4 bg-slate-50/50 rounded-2xl text-[11px] text-slate-400 flex items-center gap-2.5">
                <BadgeInfo className="w-4 h-4 text-emerald-600" />
                No pending grading entries awaiting verification.
              </div>
            ) : (
              <div className="space-y-3">
                {gradeApprovals.filter(g => g.status === 'Pending').map((approval) => (
                  <div key={approval.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 border border-slate-100/40 rounded-2xl gap-4 hover:border-emerald-100 transition-colors">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800">{approval.studentName}</strong>
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                          {approval.subjectName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Submitted by: <strong className="text-slate-500">{approval.submittedBy}</strong> · Mark: <strong className="text-slate-800">{approval.marksObtained} / {approval.maxMarks || 100}</strong> ({approval.grade})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveGrade(approval.id, 'Approved')}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wide px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>

                      <button
                        onClick={() => handleApproveGrade(approval.id, 'Rejected')}
                        className="flex items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-250 font-extrabold text-[10px] uppercase tracking-wide px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. STUDENTS ROSTER & REGISTRATION */}
      {viewSection === 'students' && <StudentsTab />}
      {viewSection === 'old-students-block' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-sans">Students Master Roster</h2>
              <p className="text-xs text-slate-500 mt-1">Register new pupils and verify their assigned homeroom classes and parents.</p>
            </div>
            <button
              onClick={() => setShowRegModal(!showRegModal)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-sans shadow-md cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {showRegModal ? 'Collapse Registration' : 'Register New Student'}
            </button>
          </div>

          {/* Registration Collapse Form */}
          {showRegModal && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Add Academic Pupil Account</h3>
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={submitRegistration} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Full Name *</label>
                    <input
                      name="fullName"
                      required
                      value={regForm.fullName}
                      onChange={handleRegisterInput}
                      placeholder="e.g. Yonas Mekonnen"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  {/* Email address */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={regForm.email}
                      onChange={handleRegisterInput}
                      placeholder="e.g. student@bya.edu"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Account Password (Optional)</label>
                    <input
                      name="password"
                      type="password"
                      value={regForm.password}
                      onChange={handleRegisterInput}
                      placeholder="Defaults to student123"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Contact Phone Code</label>
                    <input
                      name="phone"
                      value={regForm.phone}
                      onChange={handleRegisterInput}
                      placeholder="e.g. +251 911..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Date of Birth *</label>
                    <input
                      name="dob"
                      type="date"
                      required
                      value={regForm.dob}
                      onChange={handleRegisterInput}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  {/* Gender selection */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Gender *</label>
                    <select
                      name="gender"
                      value={regForm.gender}
                      onChange={handleRegisterInput}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Homeroom allocation */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Class Homeroom Assignment *</label>
                    <select
                      name="classId"
                      value={regForm.classId}
                      onChange={handleRegisterInput}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.className} - {c.section} ({c.roomNo})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Parent Reference mapping */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Assign Parent Anchor *</label>
                    <select
                      name="parentId"
                      value={regForm.parentId}
                      onChange={handleRegisterInput}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                    >
                      {parents.map(p => (
                        <option key={p.id} value={p.userId}>{p.fullName} ({p.occupation})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide uppercase px-6 py-3 rounded-xl cursor-pointer shadow"
                  >
                    Create Student & Profile Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table display */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/20">
              <span className="font-mono text-xs text-slate-500 block uppercase tracking-wider font-semibold">Active Roster</span>
              <p className="text-xs text-slate-400 mt-1">List of all currently registered elementary pupils.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Registration No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Homeroom</th>
                    <th className="p-4">Parent Guardian</th>
                    <th className="p-4">DOB</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-medium text-emerald-600">{student.registrationNo}</td>
                      <td className="p-4 font-bold text-slate-800">{student.fullName}</td>
                      <td className="p-4">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                          {student.className}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <strong>{student.parentName}</strong>
                          <p className="text-[10px] text-slate-400">{student.parentPhone}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono">{student.dob}</td>
                      <td className="p-4">{student.gender}</td>
                      <td className="p-4 pr-6 text-right">
                        <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEACHERS TAB */}
      {viewSection === 'teachers' && <TeachersTab />}

      {/* 4. ATTENDANCE TAB */}
      {viewSection === 'attendance' && <AttendanceTab />}

      {/* 5. GRADES TAB */}
      {viewSection === 'grades' && <GradesTab />}

      {/* 6. CONDUCT TAB */}
      {viewSection === 'conduct' && <ConductTab />}

      {/* 7. TIMETABLE TAB */}
      {viewSection === 'timetable' && <TimetableTab />}

      {/* 8. ANNOUNCEMENTS TAB */}
      {viewSection === 'announcements' && <AnnouncementsTab />}

      {/* 9. REPORTS TAB */}
      {viewSection === 'reports' && <ReportsTab />}

      {/* 10. SETTINGS TAB */}
      {viewSection === 'settings' && <SettingsTab />}
    </div>
  );
}
