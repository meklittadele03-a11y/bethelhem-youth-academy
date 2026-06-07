import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { ClassSection, Subject, AssessmentRecord, AttendanceRecord } from '../../types';
import { 
  FileText, Printer, Award, TrendingUp, Users, Calendar, Sparkles, Filter, 
  ShieldCheck, Search, BookOpen, AlertCircle, CheckCircle, GraduationCap,
  Clock, CheckCircle2, XCircle, ArrowUpRight, SearchCheck, UserCheck, Star,
  AlertTriangle, Play, ChevronRight, BarChart3, HelpCircle
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function ReportsTab() {
  // Core Database lists
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter criteria 
  const [selectedQuarter, setSelectedQuarter] = useState<'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4'>('Quarter 1');
  const [selectedClassId, setSelectedClassId] = useState('All');
  const [selectedRankingClassId, setSelectedRankingClassId] = useState('');
  
  // Active Navigation Report type
  const [activeReportTab, setActiveReportTab] = useState<'performance' | 'rankings' | 'attendance' | 'passfail' | 'teachers' | 'transcripts'>('performance');

  // Report card search lookup
  const [lookupStudentId, setLookupStudentId] = useState('');
  const [reportCardData, setReportCardData] = useState<any | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [reportCardError, setReportCardError] = useState('');

  // Performance query search state
  const [searchText, setSearchText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [assList, clList, subList, stuList, attList, tcList] = await Promise.all([
        schoolService.getAssessments(),
        schoolService.getClasses(),
        schoolService.getSubjects(),
        schoolService.getStudents(),
        schoolService.getAllAttendanceLogs(),
        schoolService.getTeachers()
      ]);
      
      // Normalize assessments quarters
      const normAssessments = assList.map((a: any) => ({
        ...a,
        quarter: a.quarter || (a.term === 'Term 1' ? 'Quarter 1' : a.term === 'Term 2' ? 'Quarter 2' : a.term === 'Term 3' ? 'Quarter 3' : 'Quarter 1')
      }));

      setAssessments(normAssessments);
      setClasses(clList);
      setSubjects(subList);
      setStudents(stuList);
      setAttendanceLogs(attList || []);
      setTeachers(tcList || []);

      if (clList.length > 0) {
        setSelectedRankingClassId(clList[0].id);
      }

      if (stuList.length > 0) {
        setLookupStudentId(stuList[0].userId);
      }
    } catch (err) {
      console.error('Failed to load analytical database summaries.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerPrint = () => {
    window.print();
  };

  const handleCompileReportCard = async () => {
    if (!lookupStudentId) return;
    try {
      setReportCardLoading(true);
      setReportCardError('');
      const data = await schoolService.getReportCard(lookupStudentId, selectedQuarter);
      setReportCardData(data);
    } catch (err: any) {
      setReportCardError('Failed to fetch official school report card parameters.');
    } finally {
      setReportCardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Compiling academy diagnostics, grades data, and attendance census spreadsheets...
      </div>
    );
  }

  // ==================== GLOBAL MATHEMATICS CALCULATIONS ====================

  // Filter evaluations list based on current scope matching
  const activeAssessments = assessments.filter(a => {
    const quarterMatch = a.quarter === selectedQuarter;
    const studentProfile = students.find(s => s.userId === a.studentId);
    const classMatch = selectedClassId === 'All' || (studentProfile && studentProfile.classId === selectedClassId);
    return quarterMatch && classMatch;
  });

  const totalGradesCount = activeAssessments.length;
  const averagePctGlobal = totalGradesCount > 0 
    ? Math.round(activeAssessments.reduce((sum, item) => sum + (item.marksObtained / (item.maxMarks || 100)) * 100, 0) / totalGradesCount)
    : 0;

  // Global Pass rate
  const globalPassCount = activeAssessments.filter(a => {
    return ((a.marksObtained / (a.maxMarks || 100)) * 100) >= 50; 
  }).length;
  const globalPassRate = totalGradesCount > 0 ? Math.round((globalPassCount / totalGradesCount) * 100) : 0;

  // Global attendance rate calculator
  const activeAttendanceLogs = attendanceLogs.filter(log => {
    if (selectedClassId === 'All') return true;
    return log.classId === selectedClassId;
  });
  const globalPresents = activeAttendanceLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const globalAttendanceRate = activeAttendanceLogs.length > 0 
    ? Math.round((globalPresents / activeAttendanceLogs.length) * 100) 
    : 100;

  // Grade Distributions Range buckets
  const gradeDistributionBuckets = [
    { label: 'A (90-100%) Excellent', min: 90, max: 100, count: 0, color: 'bg-emerald-500', fill: '#10b981' },
    { label: 'B (75-89%) Above Avg', min: 75, max: 89, count: 0, color: 'bg-indigo-500', fill: '#6366f1' },
    { label: 'C/D (50-74%) Satisfactory', min: 50, max: 74, count: 0, color: 'bg-amber-500', fill: '#f59e0b' },
    { label: 'F (<50%) Failing', min: 0, max: 49, count: 0, color: 'bg-rose-500', fill: '#ef4444' }
  ];

  activeAssessments.forEach(a => {
    const score = (a.marksObtained / (a.maxMarks || 100)) * 100;
    for (let bucket of gradeDistributionBuckets) {
      if (score >= bucket.min && score <= bucket.max) {
        bucket.count += 1;
        break;
      }
    }
  });

  // Calculate subject-wise performance listings
  const subjectPerformanceMetrics = subjects.map(sub => {
    const relevantAssessments = activeAssessments.filter(a => a.subjectId === sub.id || a.subjectName.toLowerCase() === sub.subjectName.toLowerCase());
    const count = relevantAssessments.length;
    const avg = count > 0 
      ? Math.round(relevantAssessments.reduce((sum, item) => sum + (item.marksObtained / (item.maxMarks || 100)) * 100, 0) / count)
      : null;
    
    const passingCount = relevantAssessments.filter(a => ((a.marksObtained / (a.maxMarks || 100)) * 100) >= 50).length;
    const passRate = count > 0 ? Math.round((passingCount / count) * 100) : 100;

    return {
      ...sub,
      recordCount: count,
      average: avg,
      passRate
    };
  }).filter(item => item.recordCount > 0);

  // Compile rankings for the ranking leaderboard section
  const compilationRankingStudents = students.filter(s => s.classId === selectedRankingClassId);
  const rankingClassObj = classes.find(c => c.id === selectedRankingClassId);

  const sectionAssessments = assessments.filter(a => {
    const isCorrectPeriod = a.quarter === selectedQuarter;
    const studentProfile = students.find(s => s.userId === a.studentId);
    return isCorrectPeriod && studentProfile?.classId === selectedRankingClassId;
  });

  const sectionRankings = compilationRankingStudents.map(student => {
    const studentGradesList = sectionAssessments.filter(a => a.studentId === student.userId);
    let totalObt = 0;
    let totalMaxPossible = 0;
    studentGradesList.forEach(g => {
      totalObt += g.marksObtained;
      totalMaxPossible += g.maxMarks;
    });
    const avg = totalMaxPossible > 0 ? Math.round((totalObt / totalMaxPossible) * 100) : 0;
    
    // Resolve attendance summary
    const studentAttendance = attendanceLogs.filter(l => l.studentId === student.userId);
    const totalDays = studentAttendance.length;
    const presents = studentAttendance.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const attendanceRate = totalDays > 0 ? Math.round((presents / totalDays) * 100) : 100;

    return {
      id: student.id,
      userId: student.userId,
      fullName: student.fullName,
      registrationNo: student.registrationNo,
      totalObt,
      totalMaxPossible,
      averagePct: avg,
      gradesCount: studentGradesList.length,
      attendanceRate
    };
  });

  // Assign Standing rankings based on averages descending
  sectionRankings.sort((a, b) => b.averagePct - a.averagePct);
  const spotlitWinner = sectionRankings.length > 0 ? sectionRankings[0] : null;

  // Compile Pass/Fail at-risk list
  const remediationRoster = students.map(student => {
    const studentAllGrades = assessments.filter(a => a.studentId === student.userId && a.quarter === selectedQuarter);
    let obtSum = 0;
    let maxSum = 0;
    studentAllGrades.forEach(a => {
      obtSum += a.marksObtained;
      maxSum += a.maxMarks;
    });
    const overallAvg = maxSum > 0 ? Math.round((obtSum / maxSum) * 100) : 0;
    
    const failingSubjects = studentAllGrades.filter(a => ((a.marksObtained / a.maxMarks) * 100) < 50);

    return {
      id: student.id,
      userId: student.userId,
      fullName: student.fullName,
      registrationNo: student.registrationNo,
      classId: student.classId,
      overallAverage: overallAvg,
      evaluationCount: studentAllGrades.length,
      failingCount: failingSubjects.length,
      failingSummary: failingSubjects.map(a => `${a.subjectName} (${Math.round((a.marksObtained/a.maxMarks)*100)}%)`).join(', ')
    };
  }).filter(r => r.evaluationCount > 0 && r.overallAverage < 50);

  // Compile Attendance summaries per section
  const sectionAttendanceAverages = classes.map(cl => {
    const sectionLogs = attendanceLogs.filter(l => l.classId === cl.id);
    const total = sectionLogs.length;
    const presents = sectionLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const rate = total > 0 ? Math.round((presents / total) * 100) : 95;
    
    // Status breakdowns
    const absentCount = sectionLogs.filter(l => l.status === 'Absent').length;
    const lateCount = sectionLogs.filter(l => l.status === 'Late').length;
    const excusedCount = sectionLogs.filter(l => l.status === 'Excused').length;

    return {
      ...cl,
      totalDaysLogged: total,
      attendanceRate: rate,
      breakdown: { absentCount, lateCount, excusedCount }
    };
  });

  // Compile Teacher Load & Performance Index
  const teacherPerformanceList = teachers.map(teacher => {
    // Check which classes/subjects are assigned
    const assignedTeachableSubjects = subjects.filter(s => s.teacherId === teacher.userId);
    const uniqueClassIds = Array.from(new Set(assignedTeachableSubjects.map(s => s.className)));
    
    // Assessments logged
    const assessmentsCreated = assessments.filter(a => {
      return assignedTeachableSubjects.some(sub => sub.subjectName.toLowerCase() === a.subjectName.toLowerCase());
    });

    let teacherClassScoreSum = 0;
    let teacherClassScoreCount = 0;
    assessmentsCreated.forEach(a => {
      teacherClassScoreSum += (a.marksObtained / a.maxMarks) * 100;
      teacherClassScoreCount += 1;
    });
    const avgScoreTaught = teacherClassScoreCount > 0 ? Math.round(teacherClassScoreSum / teacherClassScoreCount) : 0;

    return {
      ...teacher,
      teachableSubjects: assignedTeachableSubjects.map(s => s.subjectName).join(', ') || 'General Studies',
      classesCount: uniqueClassIds.length,
      assessmentsCreatedCount: assessmentsCreated.length,
      avgClassOutcome: avgScoreTaught
    };
  });

  return (
    <div className="space-y-6 text-xs print:bg-white print:text-black">
      {/* Dynamic PRINT CSS Injection */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
           aside, nav, header, button, .sidebar-rail {
            display: none !important;
          }
          #timetable-success-banner, #timetable-error-banner, #success-indicator, #error-indicator {
            display: none !important;
          }
        }
      `}</style>

      {/* Top action header: Hidden during Print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs print:hidden">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Scholastic Analytics & Intelligence Reports
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit section standing leaderboard rosters, teacher activity reports, attendance ratios, and compile official PDF report cards.
          </p>
        </div>

        <button
          onClick={triggerPrint}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          <Printer className="w-3.5 h-3.5" />
          Export Report / PDF
        </button>
      </div>

      {/* REPORTING FILTERS BAR: Hidden during Print */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-400 pl-1">
            <Filter className="w-4 h-4 text-emerald-600" />
            <strong className="text-slate-600 font-bold block">Quarter Cycle Filter:</strong>
          </div>

          <select
            value={selectedQuarter}
            onChange={e => setSelectedQuarter(e.target.value as any)}
            className="bg-slate-50 border border-slate-1.50 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 focus:bg-white text-slate-700 font-bold max-w-xs cursor-pointer"
          >
            <option value="Quarter 1">Quarter 1 (Term 1 Mid)</option>
            <option value="Quarter 2">Quarter 2 (Term 1 Final)</option>
            <option value="Quarter 3">Quarter 3 (Term 2 Mid)</option>
            <option value="Quarter 4">Quarter 4 (Final Evaluation)</option>
          </select>

          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-1.55 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 focus:bg-white text-slate-700 font-bold max-w-xs cursor-pointer"
          >
            <option value="All">All Grades & Sections</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
            ))}
          </select>
        </div>

        <span className="text-[10px] bg-indigo-50 border border-indigo-100/60 text-indigo-700 px-3 py-1 rounded-full font-mono uppercase tracking-wider font-semibold">
          System Term: 2026/2027 E.C.
        </span>
      </div>

      {/* ==================== UPPER KPI STRIP CARDS ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-1 hover:border-emerald-250 transition-colors">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Compiled Median</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-lg font-extrabold text-slate-800">{averagePctGlobal}%</strong>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">Overall</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">Selected scope testing score.</p>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pass Rate Index</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-lg font-extrabold text-slate-800">{globalPassRate}%</strong>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1 rounded">Benchmark</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">Scores equal or above 50% threshold.</p>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Attendance Rate</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-lg font-extrabold text-slate-800">{globalAttendanceRate}%</strong>
            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1 rounded">Presence</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">General section attendance index.</p>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Remediation Needs</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-lg font-extrabold text-rose-600">{remediationRoster.length} cases</strong>
            <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-1 rounded">At Risk</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">Overall average scores under 50%.</p>
        </div>
      </div>

      {/* ==================== MODULE MODULE NAVIGATION TABS ==================== */}
      <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/60 flex flex-wrap items-center gap-1 shrink-0 print:hidden">
        <button
          onClick={() => setActiveReportTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'performance'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Performance Metrics
        </button>

        <button
          onClick={() => setActiveReportTab('rankings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'rankings'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Section Leaderboards
        </button>

        <button
          onClick={() => setActiveReportTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'attendance'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Attendance Summary
        </button>

        <button
          onClick={() => setActiveReportTab('passfail')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'passfail'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pass / Fail Audit & Coaching
        </button>

        <button
          onClick={() => setActiveReportTab('teachers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'teachers'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tutors & Loads
        </button>

        <button
          onClick={() => setActiveReportTab('transcripts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            activeReportTab === 'transcripts'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/30'
              : 'text-slate-500 hover:text-slate-850'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          Official Report Cards Compile
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERFORMANCE METRICS TAB */}
      {/* ========================================================================= */}
      {activeReportTab === 'performance' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          {/* Charts Layout Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Custom Responsive SVG Grade Distributions Chart */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Overall Grade Distributions</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Auditing sample density bucketed by scoring ranges.</p>
              </div>

              {totalGradesCount === 0 ? (
                <div className="h-60 flex items-center justify-center text-slate-400 italic">
                  No records matching parameters found for visualization.
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  <div className="flex items-end justify-between gap-4 h-48 border-b border-slate-100 pb-2 bg-slate-50/20 p-4 rounded-xl">
                    {gradeDistributionBuckets.map((bucket, i) => {
                      const maxCount = Math.max(...gradeDistributionBuckets.map(b => b.count), 1);
                      const heightPercent = Math.max(((bucket.count / maxCount) * 100), 4); // minimum visible height
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                          {/* Tooltip */}
                          <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white font-bold p-1 px-2 rounded -translate-y-1 shadow-lg pointer-events-none z-10 whitespace-nowrap text-[9px] font-mono">
                            {bucket.count} evaluations ({Math.round(bucket.count / totalGradesCount * 100)}%)
                          </div>
                          
                          <div className="w-full flex-1 flex items-end">
                            <div 
                              className={`w-10 sm:w-12 rounded-t-lg mx-auto ${bucket.color} transition-all duration-700 shadow-sm group-hover:opacity-90`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          
                          <span className="text-[9px] text-slate-500 font-bold font-mono mt-2 truncate max-w-[80px]">
                            {bucket.label.charAt(0)} Grade
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Horizontal legends list */}
                  <div className="grid grid-cols-2 gap-3">
                    {gradeDistributionBuckets.map((bucket, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <span className={`w-3 h-3 rounded ${bucket.color}`} />
                        <div>
                          <strong className="block text-slate-700 font-mono text-[10px]">{bucket.label}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">Total count: {bucket.count} runs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Metrics List */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Course Performance Ratios ({selectedQuarter})</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Average scores and pass benchmarks across courses.</p>
              </div>

              {subjectPerformanceMetrics.length === 0 ? (
                <p className="text-slate-400 italic py-6">No assessments logged for subject analyses under selected filters.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {subjectPerformanceMetrics.map((sub, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-center text-slate-700 font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {sub.subjectName} ({sub.className})
                        </span>
                        <span className="font-mono text-emerald-700 font-extrabold">{sub.average}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (sub.average || 0) >= 80 ? 'bg-emerald-500' :
                            (sub.average || 0) >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${sub.average || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono pin-x pt-1 mt-0.5">
                        <span>Tested Sample size: {sub.recordCount} students</span>
                        <span className="font-bold text-slate-500">Course Passrate: {sub.passRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECTION RANKINGS LEADERBOARD */}
      {/* ========================================================================= */}
      {activeReportTab === 'rankings' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-5 h-5 text-indigo-600 animate-bounce" />
                Class Standings & Section Rankings
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Determine rankings based on cumulative weight averages across all subjects in {selectedQuarter}.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-[9px]">Select Class Section:</span>
              <select
                value={selectedRankingClassId}
                onChange={e => setSelectedRankingClassId(e.target.value)}
                className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 outline-none font-bold text-slate-700 cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Golden Spotlight Card for Class Topper */}
          {spotlitWinner && spotlitWinner.averagePct > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-indigo-50/50 border border-amber-200 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-600 fill-current animate-pulse" />
                </div>
                <div>
                  <span className="text-[8px] bg-amber-200/50 text-amber-800 border border-amber-100 uppercase tracking-widest font-black px-2 py-0.5 rounded-full font-mono">
                    Class Standing Topper #1
                  </span>
                  <h4 className="text-sm font-black text-slate-800 mt-1">{spotlitWinner.fullName}</h4>
                  <p className="text-[10px] text-slate-400">Accomplished clean sheet with average score of <strong className="text-amber-700 font-mono">{spotlitWinner.averagePct}%</strong> in the selected session audits.</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-mono">Academic Score</span>
                <strong className="text-lg text-slate-800 tracking-tight font-black">{spotlitWinner.totalObt} <span className="text-xs text-slate-400">/ {spotlitWinner.totalMaxPossible} marks</span></strong>
              </div>
            </div>
          )}

          {/* Ranking Table layout */}
          <div className="overflow-hidden border border-slate-150 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Standing Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Registration No</th>
                  <th className="p-3">Subjects Grade-outs</th>
                  <th className="p-3">Obtained Score</th>
                  <th className="p-3 text-center">Score Average</th>
                  <th className="p-3 pr-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {sectionRankings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">No academic evaluations parsed for this category.</td>
                  </tr>
                ) : (
                  sectionRankings.map((entity, index) => {
                    const isTopRank = index === 0;
                    return (
                      <tr key={entity.userId} className="hover:bg-slate-50/20">
                        <td className="p-3 pl-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-mono text-[10px] ${
                            index === 0 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' :
                            index === 1 ? 'bg-slate-200 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-850' : 'bg-slate-100 text-slate-600'
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {entity.fullName}
                            {isTopRank && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                          </div>
                        </td>
                        <td className="p-3 font-mono">{entity.registrationNo}</td>
                        <td className="p-3 text-slate-400 font-mono">{entity.gradesCount} test runs</td>
                        <td className="p-3 font-mono text-slate-500">{entity.totalObt} / {entity.totalMaxPossible}</td>
                        <td className="p-3 text-center font-extrabold font-mono text-indigo-700">{entity.averagePct}%</td>
                        <td className="p-3 pr-4 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            entity.averagePct >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {entity.averagePct >= 50 ? 'Passing Outcomes' : 'Requires Recovery'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ATTENDANCE SUMMARY HUB */}
      {/* ========================================================================= */}
      {activeReportTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          {/* Section Averages display */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Attendance Rate Comparison by Class Section</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Visual ranking roster of active student presence index.</p>
            </div>

            {sectionAttendanceAverages.length === 0 ? (
              <p className="text-slate-400 italic">No attendance datasets captured.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {sectionAttendanceAverages.map((cl, i) => (
                  <div key={cl.id} className="p-4 bg-slate-50 border border-slate-150/40 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-650 rounded text-[9px] font-mono tracking-wider font-extrabold mb-1">
                          Room {cl.roomNo}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs leading-none">{cl.className} - {cl.section}</h5>
                      </div>

                      <strong className={`text-sm font-black font-mono ${
                        cl.attendanceRate >= 90 ? 'text-emerald-700' :
                        cl.attendanceRate >= 80 ? 'text-amber-700' : 'text-rose-600'
                      }`}>
                        {cl.attendanceRate}%
                      </strong>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cl.attendanceRate >= 90 ? 'bg-emerald-500' :
                          cl.attendanceRate >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${cl.attendanceRate}%` }}
                      />
                    </div>

                    {/* Breakdown status indicators */}
                    <div className="grid grid-cols-3 text-center border-t border-slate-100 pt-2 text-[9px] text-slate-400 font-mono">
                      <div>
                        <span>{cl.breakdown.absentCount}</span>
                        <span className="block font-bold uppercase text-[8px] text-rose-500">Absences</span>
                      </div>
                      <div className="border-x border-slate-100">
                        <span>{cl.breakdown.lateCount}</span>
                        <span className="block font-bold uppercase text-[8px] text-amber-500 font-sans">Lates</span>
                      </div>
                      <div>
                        <span>{cl.breakdown.excusedCount}</span>
                        <span className="block font-bold uppercase text-[8px] text-indigo-500 font-sans">Excuses</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Specific Absences Alert Board */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Active Attendance Roll Summary by Student
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Summary logs of overall present versus absent listings in selected filters.</p>
            </div>

            <div className="overflow-hidden border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider animate-pulse-slow">
                    <th className="p-3 pl-4">Student Name</th>
                    <th className="p-3">Room Level</th>
                    <th className="p-3">Presents Checked</th>
                    <th className="p-3">Absence Logs</th>
                    <th className="p-3">Late Incidents</th>
                    <th className="p-3 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {students.map(entity => {
                    const studentLogs = attendanceLogs.filter(l => l.studentId === entity.userId);
                    const totalDays = studentLogs.length;
                    const presentDays = studentLogs.filter(l => l.status === 'Present').length;
                    const absentDays = studentLogs.filter(l => l.status === 'Absent').length;
                    const lateDays = studentLogs.filter(l => l.status === 'Late').length;
                    const rates = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;
                    
                    const classData = classes.find(c => c.id === entity.classId);

                    return (
                      <tr key={entity.id} className="hover:bg-slate-50/10">
                        <td className="p-3 pl-4 font-bold text-slate-800">{entity.fullName}</td>
                        <td className="p-3">{classData ? `${classData.className} - ${classData.section}` : '--'}</td>
                        <td className="p-3 text-emerald-700 font-mono">{presentDays} occurrences</td>
                        <td className="p-3 text-rose-600 font-mono">{absentDays} occurrences</td>
                        <td className="p-3 text-amber-600 font-mono">{lateDays} occurrences</td>
                        <td className="p-3 text-right font-extrabold font-mono">
                          <span className={`inline-block px-2 py-0.5 rounded ${rates >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {rates}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PASS/FAIL AUDITING & REMEDIATION */}
      {/* ========================================================================= */}
      {activeReportTab === 'passfail' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          {/* Main overview metrics */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                Under-performing Remediation & Recovery Auditing
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Identified students whose current cumulative average is below the standard <strong className="text-slate-700">50% GPA benchmark</strong> in {selectedQuarter}.</p>
            </div>

            {remediationRoster.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-dashed border-emerald-250/60 rounded-2xl space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-extrabold text-emerald-800 text-xs">Exempt: 100% Academic Compliance!</p>
                <p className="text-[10px] text-emerald-600 font-medium">All student profiles successfully logged averages above the 50% pass rate threshold for current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-slate-200/50 p-4 rounded-2xl text-[11px] text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-black uppercase tracking-wider block text-[9px] text-rose-700 mb-1">Intervention Required</span>
                    There are <strong className="font-extrabold text-slate-800">{remediationRoster.length} student profiles</strong> showing performance deficits. Academic recovery checklists and homework support programs must be organized for matching pupils.
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="p-3 pl-4">Student Name</th>
                        <th className="p-3">Grade Section</th>
                        <th className="p-3">Current Average</th>
                        <th className="p-3">Fenced Exams Count</th>
                        <th className="p-3">Deficit Subject Courses (Details)</th>
                        <th className="p-3 pr-4 text-right">Emergency Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {remediationRoster.map(entity => {
                        const classData = classes.find(c => c.id === entity.classId);
                        return (
                          <tr key={entity.id} className="hover:bg-slate-50/15">
                            <td className="p-3 pl-4 font-bold text-slate-850">{entity.fullName}</td>
                            <td className="p-3 text-slate-500 font-mono font-bold">{classData ? `${classData.className} - ${classData.section}` : '--'}</td>
                            <td className="p-3 font-mono font-extrabold text-rose-600">{entity.overallAverage}%</td>
                            <td className="p-3 font-mono text-slate-400">{entity.evaluationCount} marks logged</td>
                            <td className="p-3 max-w-xs truncate italic text-rose-700 font-medium font-mono">{entity.failingSummary || 'Failing Overall GPA'}</td>
                            <td className="p-3 pr-4 text-right">
                              <button
                                onClick={() => {
                                  alert(`Academic Recovery Alert broadcasted via parent email and student terminal dashboard for ${entity.fullName}.`);
                                }}
                                className="px-3 py-1.5 bg-rose-650 hover:bg-rose-750 text-white font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer shadow-sm"
                              >
                                Trigger Intervention
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TEACHER LOAD & PRODUCTIVITY REPORTS */}
      {/* ========================================================================= */}
      {activeReportTab === 'teachers' && (
        <div className="space-y-6 animate-fade-in print:hidden">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Educators Load Ledger & Grade Outcomes
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Audit courses taught, evaluations submitted, and classroom achievements per instructor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teacherPerformanceList.map((teacher, index) => {
                return (
                  <div key={teacher.id || index} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5 hover:border-slate-350 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] bg-slate-200 text-slate-600 border border-slate-100 uppercase tracking-widest font-black px-2 py-0.5 rounded-full font-mono">
                          {teacher.specialization || 'Academic Tutor'}
                        </span>
                        <h4 className="font-extrabold text-slate-850 text-xs mt-1.5">{teacher.fullName}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Subjects Managed</span>
                        <strong className="text-sm font-bold text-slate-800 font-mono tracking-tight">
                          {teacher.teachableSubjects.split(', ').length} Course(s)
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center rounded-xl bg-white border border-slate-100 p-3.5 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-450 block uppercase font-mono leading-none">Rooms Served</span>
                        <strong className="block text-[13px] font-mono text-indigo-700 mt-1">{teacher.classesCount} Class(es)</strong>
                      </div>
                      <div className="border-x border-slate-100">
                        <span className="text-[10px] text-slate-450 block uppercase font-mono leading-none">Markings Added</span>
                        <strong className="block text-[13px] font-mono text-indigo-700 mt-1">{teacher.assessmentsCreatedCount} Runs</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 block uppercase font-mono leading-none">Class Average</span>
                        <strong className="block text-[13px] font-mono text-emerald-700 mt-1">{teacher.avgClassOutcome}%</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 italic bg-slate-150/40 p-2 rounded-lg border border-slate-100">
                      <strong>Assigned courses:</strong> {teacher.teachableSubjects}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OFFICIAL REPORT CARD & TRANSCRIPT PORTLET */}
      {/* ========================================================================= */}
      {activeReportTab === 'transcripts' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Student Official Transcript & Report Card General Ledger
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Compile separate transcript models containing averages, stand rankings as well as co-curricular ethics audits.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={lookupStudentId}
                onChange={e => setLookupStudentId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-700 cursor-pointer text-xs"
              >
                {students.map(s => (
                  <option key={s.id} value={s.userId}>{s.fullName} ({s.className})</option>
                ))}
              </select>

              <button
                onClick={handleCompileReportCard}
                disabled={reportCardLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl cursor-pointer disabled:bg-slate-100 shrink-0 transition-colors"
              >
                {reportCardLoading ? 'Generating...' : 'Compile Report Card'}
              </button>
            </div>
          </div>

          {reportCardError && (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs print:hidden">
              {reportCardError}
            </div>
          )}

          {reportCardData ? (
            /* Premium Printable Official Transcript Layout */
            <div className="border border-slate-200/85 rounded-3xl p-6 sm:p-8 space-y-6 print:border-none print:p-0 print:space-y-4 shadow-sm select-text">
              <div className="text-center pb-4 border-b border-double border-slate-200 space-y-1">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase font-sans">Bethelhem Youth Academy</h2>
                <span className="text-[10px] text-slate-400 font-mono block">Estd. 1998 · Licensed and Registered Ministry of Education</span>
                <h3 className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest pt-1">{reportCardData.quarter} Official Academic Transcript</h3>
              </div>

              {/* Profile Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-transparent print:border-slate-300 print:p-2 select-text">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-medium">Student Name</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-bold">{reportCardData.studentName}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-medium">Registration No</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-mono font-bold">{reportCardData.registrationNo}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-medium">Academic Program</span>
                  <strong className="text-xs text-slate-800 mt-0.5 block font-bold">{reportCardData.className} · {reportCardData.section}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-medium">Approval Status</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 ${reportCardData.approvalStatus === 'Approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {reportCardData.approvalStatus === 'Approved' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    {reportCardData.approvalStatus}
                  </span>
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="overflow-hidden border border-slate-150 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3 pl-4">Subject Title</th>
                      <th className="p-3">Obtained Marks</th>
                      <th className="p-3">Max Possible</th>
                      <th className="p-3">Conversion %</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3 pr-4">Tutor Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {reportCardData.grades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic">No approved grades registered in archives for this period.</td>
                      </tr>
                    ) : (
                      reportCardData.grades.map((g: any, index: number) => {
                        const pct = Math.round((g.marksObtained / g.maxMarks) * 100);
                        return (
                          <tr key={index} className="hover:bg-slate-50/10">
                            <td className="p-3 pl-4 font-bold text-slate-850">{g.subjectName}</td>
                            <td className="p-3 font-mono text-slate-500">{g.marksObtained}</td>
                            <td className="p-3 text-slate-400 font-mono">{g.maxMarks}</td>
                            <td className="p-3 font-mono font-bold text-slate-650">{pct}%</td>
                            <td className="p-3 font-bold font-mono">
                              <span className={`px-2.5 py-0.5 rounded font-black ${pct >= 50 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' : 'bg-rose-50 text-rose-700 border border-rose-100/30'}`}>
                                {g.grade}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-slate-450 italic max-w-xs truncate">{g.remarks || 'Satisfactory work.'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Metrical Summaries Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 border border-slate-150 rounded-2xl bg-white select-text">
                {/* Totals & Averages with pass status */}
                <div className="space-y-1.5 border-r border-slate-100 pr-4 print:border-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Aggregated Results</span>
                  <p className="text-xs font-bold text-slate-700">
                    Total Obtained: <strong className="text-slate-900">{reportCardData.totalObtained} / {reportCardData.totalMax}</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-3 py-1 text-xs font-bold rounded-xl ${reportCardData.passStatus === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      Average {reportCardData.average}% · {reportCardData.passStatus}
                    </span>
                  </div>
                </div>

                {/* Section Ranking */}
                <div className="space-y-1.5 border-r border-slate-100 pr-4 print:border-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Section Rank</span>
                  <p className="text-xs font-bold text-slate-700">
                    Leaderboard Standing: <strong className="text-indigo-700 text-sm font-black">{reportCardData.rank ? `#${reportCardData.rank}` : '--'}</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Ranked within section of {reportCardData.totalStudents} students</span>
                </div>

                {/* Attendance and Conduct */}
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Co-Curricular & Ethics Audit</span>
                  <p className="text-xs col-span-1 text-slate-700">
                    Ethics / Conduct Grade: <strong className="text-emerald-700 uppercase font-mono font-bold">
                      {reportCardData.conductGrade === 'Excellent' ? 'A = Excellent' : 
                       reportCardData.conductGrade === 'Good' ? 'B = Good' : 
                       reportCardData.conductGrade === 'Needs Improvement' ? 'C = Needs Improvement' : 
                       reportCardData.conductGrade}
                    </strong>
                  </p>
                  {reportCardData.conductComment && (
                    <div className="text-[10px] text-slate-500 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mt-1">
                      Tutor Comment: "{reportCardData.conductComment}"
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-mono ${reportCardData.attendanceSummary.attendanceRate >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      Attendance Rate: {reportCardData.attendanceSummary.attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* End Sheet Signature (optimised for Print Output) */}
              <div className="border-t border-dashed border-slate-200 pt-8 text-center text-slate-400 text-[10px] space-y-4 print:mt-6">
                <div className="flex justify-between px-6">
                  <div className="text-center space-y-1">
                    <strong className="block text-slate-700 font-bold font-sans">Tutor Sign-off</strong>
                    <span className="text-[8px] font-mono block">Subject Teacher Guild</span>
                    <div className="w-28 border-b border-slate-300 mt-6 mx-auto" />
                  </div>

                  <div className="text-center space-y-1">
                    <strong className="block text-slate-700 font-bold font-sans">Principal Signature</strong>
                    <span className="text-[8px] font-mono block">Registry seal certified</span>
                    <div className="w-28 border-b border-slate-300 mt-6 mx-auto" />
                  </div>
                </div>

                <p className="font-mono text-[9px] text-slate-450 pt-2">
                  Official document generated electronically on {new Date().toLocaleDateString('en-US')}. Bethelhem Youth Academy transcript registry.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200/60 text-slate-400 font-medium">
              Select a student and click "Compile Report Card" to generate official printable records!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
