import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Flame,
  CheckCircle,
  Bookmark,
  FileText,
  Printer,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { schoolService } from '../services/api';
import { User, AttendanceRecord, AssessmentRecord } from '../types';
import TimetableTab from './admin/TimetableTab';
import AnnouncementsTab from './admin/AnnouncementsTab';

interface StudentDashboardProps {
  currentUser: User;
  activeSection: string;
}

export default function StudentDashboard({ currentUser, activeSection }: StudentDashboardProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Quarter-based report card states
  const [selectedQuarter, setSelectedQuarter] = useState<'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4'>('Quarter 1');
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [reportCardError, setReportCardError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch attendance records
      const allAttendance = await schoolService.getAttendance('', '');
      const studentAttendance = allAttendance.filter((a: AttendanceRecord) => a.studentId === currentUser.id);
      setAttendance(studentAttendance);

      // Trigger initial report card generation
      setReportCardLoading(true);
      const card = await schoolService.getReportCard(currentUser.id, selectedQuarter);
      setReportCard(card);
    } catch (err) {
      console.error('Error loading student metrics', err);
    } finally {
      setLoading(false);
      setReportCardLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Handle quarter selection changes dynamically
  useEffect(() => {
    const fetchQuarterCard = async () => {
      try {
        setReportCardLoading(true);
        setReportCardError('');
        const card = await schoolService.getReportCard(currentUser.id, selectedQuarter);
        setReportCard(card);
      } catch (err) {
        setReportCardError('Failed to load grades for select period.');
      } finally {
        setReportCardLoading(false);
      }
    };
    if (currentUser && !loading) {
      fetchQuarterCard();
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Student Portal Center</h2>
              <p className="text-xs text-slate-500 mt-1">Bethelhem Youth Academy academic, grading and daily attendance review card.</p>
            </div>
            
            <div className="bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-xl flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Perfect Streak!</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Avg Attendance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Attendance Rate</span>
                <strong className="text-3xl font-extrabold text-slate-800 block mt-2">{attendancePct}%</strong>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Excellent roll attendance!</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Overall Rate */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Active GPA Median</span>
                <strong className="text-3xl font-extrabold text-slate-800 block mt-2">{reportCard ? reportCard.average : 85}%</strong>
                <span className="text-[10px] text-indigo-600 font-bold block mt-1">Academic Status: {reportCard ? reportCard.passStatus : 'Pass'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* General school info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Class & Section ID</span>
                <strong className="text-xl font-bold text-slate-800 block mt-3">{reportCard ? reportCard.className + ' - ' + reportCard.section : 'Grade 5 - Section A'}</strong>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">Status: Certified Active</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Home announcement bar */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden">
            <span className="bg-white/10 px-3 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider">School Announcements</span>
            <h3 className="text-xl font-bold mt-4 tracking-tight font-sans">Official Report Card Rankings Released</h3>
            <p className="text-slate-200 text-xs mt-2 leading-relaxed">
              Academic rankings are calculated automatically inside sections for each active evaluating quarter. Pick the Academics page in the side tab bar to compile and view your official report card transcripts.
            </p>
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE LOG */}
      {viewSection === 'attendance' && (
        <div className="space-y-6 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-sans">Attendance Ledger</h2>
            <p className="text-xs text-slate-500 mt-1">Historical roll-call states logged for your profile this semester.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Roll Call Date</th>
                    <th className="p-4">Day Status</th>
                    <th className="p-4 pr-6">Teacher Remarks / Notes</th>
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
                        <span className={`inline-block font-extrabold text-[10px] uppercase px-3 py-1 rounded-full ${
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
                        {log.remarks || 'No notes logged.'}
                      </td>
                    </tr>
                  ))}

                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold leading-relaxed">
                        No attendance roll call events found for your account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. GRADES REPORT CARD TRANSCRIPT */}
      {viewSection === 'grades' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-sans">Official Transcript & Report Card</h2>
              <p className="text-xs text-slate-500 mt-1">Check class average percentage, grades, rankings, progress, and download certified report cards.</p>
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
                  <option value="Quarter 4">Quarter 4 (Final)</option>
                </select>
              </div>

              <button
                onClick={triggerPrint}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Transcript
              </button>
            </div>
          </div>

          {reportCardLoading ? (
            <div className="p-12 text-center text-slate-400 italic">
              Compiling report card records and dense rankings from the school registry...
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
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic font-medium">No approved grades published for your account for this quarter/term.</td>
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
                  <p className="text-xs text-slate-750">
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
                    <span className={`px-2 py-0.5 text-[10px] rounded font-mono ${reportCard.attendanceSummary.attendanceRate >= 90 ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-slate-100 text-slate-500 font-bold'}`}>
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
              No report card datasets fetched.
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
