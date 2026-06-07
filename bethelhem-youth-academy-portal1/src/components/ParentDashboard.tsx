import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Award, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Activity,
  ShieldAlert,
  Bell,
  Printer,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { schoolService } from '../services/api';
import { User, AttendanceRecord, AssessmentRecord } from '../types';
import TimetableTab from './admin/TimetableTab';
import AnnouncementsTab from './admin/AnnouncementsTab';

interface ParentDashboardProps {
  currentUser: User;
  activeSection: string;
}

export default function ParentDashboard({ currentUser, activeSection }: ParentDashboardProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [childProfile, setChildProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Parent Quarter selection for child
  const [selectedQuarter, setSelectedQuarter] = useState<'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4'>('Quarter 1');
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [reportCardError, setReportCardError] = useState('');

  const loadParentChildData = async () => {
    try {
      setLoading(true);
      const studentsList = await schoolService.getStudents();
      const matchedChild = studentsList.find(s => s.parentId === currentUser.id);

      if (matchedChild) {
        setChildProfile(matchedChild);
        
        // Filter attendance
        const allAttendance = await schoolService.getAttendance('', '');
        const studentAttendance = allAttendance.filter((a: AttendanceRecord) => a.studentId === matchedChild.userId);
        setAttendance(studentAttendance);

        // Fetch report card
        setReportCardLoading(true);
        const card = await schoolService.getReportCard(matchedChild.userId, selectedQuarter);
        setReportCard(card);
      }
    } catch (err) {
      console.error('Error fetching parent metrics', err);
    } finally {
      setLoading(false);
      setReportCardLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadParentChildData();
    }
  }, [currentUser]);

  // Dynamic reload when parent changes selected quarter
  useEffect(() => {
    const fetchChildQuarterCard = async () => {
      if (!childProfile) return;
      try {
        setReportCardLoading(true);
        setReportCardError('');
        const card = await schoolService.getReportCard(childProfile.userId, selectedQuarter);
        setReportCard(card);
      } catch (err) {
        setReportCardError('Failed to retrieve child evaluation transcript.');
      } finally {
        setReportCardLoading(false);
      }
    };
    if (childProfile && !loading) {
      fetchChildQuarterCard();
    }
  }, [selectedQuarter]);

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Attendance rate
  const totalLogs = attendance.length;
  const daysPresent = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const attendancePct = totalLogs > 0 ? Math.round((daysPresent / totalLogs) * 100) : 100;

  const viewSection = activeSection === 'overview' ? 'overview' : activeSection;

  return (
    <div className="space-y-6 text-xs print:bg-white print:text-black">
      {/* 1. OVERVIEW SCREEN */}
      {viewSection === 'overview' && (
        <div className="space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Parent Monitoring Deck</h2>
              <p className="text-xs text-slate-500 mt-1">Track classroom progress, daily roll logs and announcements for your child.</p>
            </div>
            
            <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center gap-3">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Pupil:</span>
              <strong className="text-sm font-black text-slate-800">{childProfile?.fullName || 'No registered child'}</strong>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Attendance tracking */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Daily Attendance</span>
                <strong className="text-3xl font-extrabold text-slate-800 block mt-2">{attendancePct}%</strong>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Status: Regular & active</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Academic stats */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Quarterly Percentage Avg</span>
                <strong className="text-3xl font-extrabold text-slate-800 block mt-2">{reportCard ? reportCard.average : 85}%</strong>
                <span className="text-[10px] text-indigo-600 font-bold block mt-1">Standing: {reportCard ? reportCard.passStatus : 'Passing'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            {/* Homeroom tracker */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Active Class level</span>
                <strong className="text-xl font-bold text-slate-800 block mt-3">{childProfile?.className || 'Grade 5'} · {childProfile?.section || 'Section A'}</strong>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">Homeroom: Room 201</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Child summary and Notification bulletin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-8 shadow">
              <span className="text-[9px] font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full uppercase">Tutor Notification</span>
              <h4 className="text-lg font-bold mt-4 font-sans">Homeroom Educational Remarks</h4>
              <p className="text-xs text-indigo-200/95 mt-2 leading-relaxed">
                Your child is exhibiting amazing dedication. He is focused, highly cooperative, and shows exceptional development in writing quizzes. Ensure you sign and return the official report certificates once checked.
              </p>
            </div>

            {/* School communication board */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600 animate-bounce" />
                Administrative Board Notes
              </h3>

              <div className="space-y-3">
                {[
                  { title: 'June Parent Consultation Session', date: 'June 02, 2026', body: 'Consultation signups are starting soon with school tutors.' },
                  { title: 'Ethiopian National Holiday Closure', date: 'May 28, 2026', body: 'Portal will remain active while classes resume on Monday.' }
                ].map((note, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-mono block">{note.date}</span>
                    <strong className="text-xs text-slate-700 block mt-1">{note.title}</strong>
                    <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE HISTORY LIST */}
      {viewSection === 'attendance' && (
        <div className="space-y-6 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-sans">Child Attendance Tracker</h2>
            <p className="text-xs text-slate-500 mt-1">Review the daily classroom physical attendance roster logged for your child.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Roll Call Date</th>
                    <th className="p-4">Daily Status</th>
                    <th className="p-4 pr-6">Teacher Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendance.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {log.date}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block font-bold text-[10px] uppercase px-3 py-1 rounded-full ${
                          log.status === 'Present' 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : log.status === 'Late' 
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-slate-500 italic max-w-sm truncate">
                        {log.remarks || 'No detailed remarks logged.'}
                      </td>
                    </tr>
                  ))}

                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold leading-relaxed">
                        No attendance roll call records registered for your child.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. GRADES ANALYSIS FOR CHILDREN */}
      {viewSection === 'grades' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-sans">Official Transcript Progress Card</h2>
              <p className="text-xs text-slate-500 mt-1">Review quarter evaluations, section ranks, conduct statuses and attendance summaries.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Period:</span>
                <select
                  value={selectedQuarter}
                  onChange={e => setSelectedQuarter(e.target.value as any)}
                  className="bg-transparent border-none py-0.5 outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Quarter 1">Quarter 1</option>
                  <option value="Quarter 2">Quarter 2</option>
                  <option value="Quarter 3">Quarter 3</option>
                  <option value="Quarter 4 font-bold">Quarter 4 (Final)</option>
                </select>
              </div>

              <button
                onClick={triggerPrint}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
            </div>
          </div>

          {reportCardLoading ? (
            <div className="p-12 text-center text-slate-401 italic">
              Compiling student records and section rankings from Bethelhem registry...
            </div>
          ) : reportCardError ? (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl font-mono text-center">
              {reportCardError}
            </div>
          ) : reportCard ? (
            <div className="border border-slate-200/85 rounded-3xl p-6 sm:p-8 space-y-6 print:border-none print:p-0 print:space-y-4 bg-white">
              <div className="text-center pb-4 border-b border-double border-slate-200 space-y-1">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase font-sans">Bethelhem Youth Academy</h2>
                <span className="text-[10px] text-slate-400 font-mono block">Official Transcript Registry · Ministry of Education licensed</span>
                <h3 className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest pt-1">{reportCard.quarter} Academic Report Card</h3>
              </div>

              {/* Profile card panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-50 print:bg-transparent print:border-slate-300 print:p-2">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Student Name</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-bold">{reportCard.studentName}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Registration No</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-mono font-bold">{reportCard.registrationNo}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Assigned Section</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-bold">{reportCard.className} · {reportCard.section}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Transcript Stamp</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 ${reportCard.approvalStatus.includes('Pending') ? 'text-amber-700 animate-pulse' : 'text-emerald-700'}`}>
                    {reportCard.approvalStatus.includes('Pending') ? (
                      <Sparkles className="w-3 text-amber-500 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    {reportCard.approvalStatus}
                  </span>
                </div>
              </div>

              {/* Subject scores table */}
              <div className="overflow-hidden border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3 pl-4">Subject Title</th>
                      <th className="p-3">Obtained Marks</th>
                      <th className="p-3">Max Possible</th>
                      <th className="p-3">Conversion %</th>
                      <th className="p-3">Grade Letter</th>
                      <th className="p-3 pr-4">Teacher Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {reportCard.grades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic font-medium">No approved grades published for this student this quarter yet.</td>
                      </tr>
                    ) : (
                      reportCard.grades.map((g: any, idx: number) => {
                        const pct = Math.round((g.marksObtained / g.maxMarks) * 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/10">
                            <td className="p-3 pl-4 font-bold text-slate-800">{g.subjectName}</td>
                            <td className="p-3 font-mono">{g.marksObtained}</td>
                            <td className="p-3 text-slate-400 font-mono">{g.maxMarks}</td>
                            <td className="p-3 font-mono">{pct}%</td>
                            <td className="p-3 font-bold font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${pct >= 50 ? 'bg-indigo-50/50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                                {g.grade}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-slate-500 italic max-w-xs truncate">{g.remarks || 'Excellent work.'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 border border-slate-150 rounded-2xl bg-white">
                <div className="space-y-1.5 border-r border-slate-100 pr-4 print:border-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Consolidated Metrics</span>
                  <p className="text-xs font-bold text-slate-700">
                    Grand Obtained: <strong className="text-slate-900">{reportCard.totalObtained} / {reportCard.totalMax}</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-3 py-1 text-xs font-bold rounded-xl ${reportCard.passStatus === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      Average {reportCard.average}% · {reportCard.passStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-r border-slate-100 pr-4 print:border-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Standing & Rank</span>
                  <p className="text-xs font-bold text-slate-700 text-slate-800">
                    Section Standing: <strong className="text-indigo-700 text-sm font-black">{reportCard.rank ? `#${reportCard.rank}` : '--'}</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Ranked only within section size of {reportCard.totalStudents} pupils</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Elocution & Attendance</span>
                  <p className="text-xs text-slate-755">
                    Conduct Score: <strong className="text-emerald-700 uppercase font-mono font-bold">
                      {reportCard.conductGrade === 'Excellent' ? 'A = Excellent' : 
                       reportCard.conductGrade === 'Good' ? 'B = Good' : 
                       reportCard.conductGrade === 'Needs Improvement' ? 'C = Needs Improvement' : 
                       reportCard.conductGrade}
                    </strong>
                  </p>
                  {reportCard.conductComment && (
                    <div className="text-[10px] text-slate-500 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mt-1">
                      Comment: "{reportCard.conductComment}"
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-mono ${reportCard.attendanceSummary.attendanceRate >= 90 ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      Attendance Summary: {reportCard.attendanceSummary.attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Board */}
              <div className="border-t border-dashed border-slate-200 pt-8 text-center text-slate-400 text-[10px] space-y-4 print:mt-6">
                <div className="flex justify-between px-6">
                  <div className="text-center space-y-1">
                    <strong className="block text-slate-700 font-bold">Classroom Tutor Signature</strong>
                    <div className="w-28 border-b border-slate-300 mt-6 mx-auto" />
                  </div>

                  <div className="text-center space-y-1">
                    <strong className="block text-slate-700 font-bold">Directorial Administration Seal</strong>
                    <div className="w-28 border-b border-slate-300 mt-6 mx-auto" />
                  </div>
                </div>

                <p className="font-mono text-[9px] text-slate-400">
                  Document generated securely via the Bethelhem Youth Academy student portal. Audit certified.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl text-slate-400 font-semibold text-xs">
              No report card data published.
            </div>
          )}
        </div>
      )}

      {viewSection === 'timetable' && (
        <TimetableTab />
      )}

      {viewSection === 'announcements' && (
        <AnnouncementsTab />
      )}
    </div>
  );
}
