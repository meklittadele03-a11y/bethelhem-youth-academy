import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { ClassSection, Subject, AssessmentRecord } from '../../types';
import { 
  GraduationCap, FolderOpen, AlertCircle, CheckCircle, Plus, Search, 
  Award, Star, Trash2, Edit3, Check, X, Trophy, Percent, Users, 
  LayoutDashboard, SlidersHorizontal, ArrowUpDown 
} from 'lucide-react';

export default function GradesTab() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4'>('Quarter 1');
  const [selectedClassIdFilter, setSelectedClassIdFilter] = useState('');
  const [currentViewMode, setCurrentViewMode] = useState<'roster' | 'rankings'>('roster');

  // Inline editing management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    marksObtained: 0,
    maxMarks: 100,
    remarks: ''
  });

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Form state
  const [form, setForm] = useState({
    studentId: '',
    subjectId: '',
    marksObtained: '',
    maxMarks: '100',
    quarter: 'Quarter 1' as 'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4',
    remarks: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [assList, clList, subList, stuList] = await Promise.all([
        schoolService.getAssessments(),
        schoolService.getClasses(),
        schoolService.getSubjects(),
        schoolService.getStudents()
      ]);

      // Normalize terms to Quarters for clean back compatibility
      const normAssessments = assList.map((a: any) => ({
        ...a,
        quarter: a.quarter || (a.term === 'Term 1' ? 'Quarter 1' : a.term === 'Term 2' ? 'Quarter 2' : a.term === 'Term 3' ? 'Quarter 3' : 'Quarter 1')
      }));

      setAssessments(normAssessments);
      setClasses(clList);
      setSubjects(subList);
      setStudents(stuList);

      if (stuList.length > 0 && subList.length > 0) {
        setForm(prev => ({
          ...prev,
          studentId: stuList[0].userId,
          subjectId: subList[0].id
        }));
      }

      if (clList.length > 0) {
        setSelectedClassIdFilter(clList[0].id);
      }
    } catch (err) {
      console.error('Failed to load grades directory.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculateGradeFromMarks = (obtained: number, max: number) => {
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    if (pct >= 90) return 'A+';
    if (pct >= 85) return 'A';
    if (pct >= 80) return 'A-';
    if (pct >= 75) return 'B+';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.marksObtained) {
      setError('Please specify marks obtained.');
      return;
    }

    const marks = Number(form.marksObtained);
    const maxMarks = Number(form.maxMarks);

    if (isNaN(marks) || marks < 0 || marks > maxMarks) {
      setError(`Marks obtained must be a positive integer below max value ${maxMarks}.`);
      return;
    }

    try {
      const studentObj = students.find(s => s.userId === form.studentId);
      const subjectObj = subjects.find(sub => sub.id === form.subjectId);

      const computedGrade = calculateGradeFromMarks(marks, maxMarks);

      await schoolService.submitAssessment({
        studentId: form.studentId,
        studentName: studentObj ? studentObj.fullName : 'Student',
        subjectId: form.subjectId,
        subjectName: subjectObj ? subjectObj.subjectName : 'Subject',
        marksObtained: marks,
        maxMarks: maxMarks,
        grade: computedGrade,
        quarter: form.quarter,
        classId: studentObj?.classId || 'c-01',
        remarks: form.remarks,
        status: 'Approved' // Direct approval for Admin entries
      });

      setSuccess('Academic grade submitted and stored in school archives.');
      setForm(prev => ({ ...prev, marksObtained: '', remarks: '' }));
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to commit academic score entry.');
    }
  };

  const startEditing = (record: AssessmentRecord) => {
    setEditingId(record.id);
    setEditForm({
      marksObtained: record.marksObtained,
      maxMarks: record.maxMarks || 100,
      remarks: record.remarks || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSuccess('');
    setError('');
    
    if (editForm.marksObtained < 0 || editForm.marksObtained > editForm.maxMarks) {
      setError(`Marks obtained must be between 0 and ${editForm.maxMarks}.`);
      return;
    }

    const updatedGrade = calculateGradeFromMarks(editForm.marksObtained, editForm.maxMarks);

    try {
      await schoolService.updateAssessment(id, {
        marksObtained: editForm.marksObtained,
        maxMarks: editForm.maxMarks,
        grade: updatedGrade,
        remarks: editForm.remarks
      });

      setSuccess('Academic grade revised successfully.');
      setEditingId(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revise marks.');
    }
  };

  const deleteGradeRecord = async (id: string) => {
    if (!window.confirm('Are you absolutely certain you wish to delete this academic record? This action is irreversible.')) {
      return;
    }
    
    setSuccess('');
    setError('');

    try {
      await schoolService.deleteAssessment(id);
      setSuccess('Academic record cleared from registry.');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete record.');
    }
  };

  // Section Rankings and Stats algorithm
  const getSectionRankingsList = () => {
    // 1. Get students for selected Class/Section
    const sectionStudents = students.filter(s => s.classId === selectedClassIdFilter);
    if (sectionStudents.length === 0) return [];

    // 2. Aggregate student averages for selected Quarter
    const sectionRoster = sectionStudents.map(student => {
      // Filter approved grades for student and quarter
      const studentGrades = assessments.filter(a => {
        return a.studentId === student.userId && a.quarter === selectedQuarterFilter;
      });

      let totalObtained = 0;
      let totalMax = 0;
      studentGrades.forEach(g => {
        totalObtained += g.marksObtained;
        totalMax += g.maxMarks;
      });

      const avgPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      return {
        studentId: student.userId,
        fullName: student.fullName,
        registrationNo: student.registrationNo,
        gradesCount: studentGrades.length,
        totalObtained,
        totalMax,
        avgPct,
        passStatus: totalMax > 0 ? (avgPct >= 50 ? 'Pass' : 'Fail') : 'No Grades'
      };
    });

    // 3. Dense sort rankings
    const sortedRoster = [...sectionRoster].sort((a, b) => b.avgPct - a.avgPct);
    
    let currentRank = 1;
    return sortedRoster.map((item, index) => {
      if (index > 0 && item.avgPct < sortedRoster[index - 1].avgPct) {
        currentRank = index + 1;
      }
      return {
        ...item,
        rank: item.gradesCount > 0 ? currentRank : undefined
      };
    });
  };

  const calculatedRankings = getSectionRankingsList();
  const passingRankings = calculatedRankings.filter(r => r.gradesCount > 0 && r.avgPct >= 50).length;
  const failingRankings = calculatedRankings.filter(r => r.gradesCount > 0 && r.avgPct < 50).length;

  // Filter master list
  const filteredAssessments = assessments.filter(a => {
    const matchesSubject = !selectedSubjectId || a.subjectId === selectedSubjectId;
    const matchesQuarter = a.quarter === selectedQuarterFilter;
    const matchesQuery = !searchQuery || a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || a.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesQuarter && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Academics & Grade Records</h3>
          <p className="text-xs text-slate-500 mt-0.5">Control, analyze, or input student assessment performance.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentViewMode(currentViewMode === 'roster' ? 'rankings' : 'roster')}
            className={`flex items-center gap-2 font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all border ${
              currentViewMode === 'rankings' 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            {currentViewMode === 'rankings' ? 'Switch to Grade Matrix' : 'Section Leaderboard Rankings'}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Hide Form' : 'Register Custom Marks'}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grade Submission Form */}
      {showAddForm && (
        <form onSubmit={submitGrade} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2 mb-2">
            <h4 className="font-extrabold text-slate-700 uppercase tracking-widest text-[10px]">Registry Grade Entry Submission (Admin Direct)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Select Class Student *</label>
              <select
                name="studentId"
                value={form.studentId}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              >
                {students.map(s => (
                  <option key={s.id} value={s.userId}>{s.fullName} ({s.className})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Assigned Subject Course *</label>
              <select
                name="subjectId"
                value={form.subjectId}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.subjectName} ({sub.className})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Academic Quarter Period *</label>
              <select
                name="quarter"
                value={form.quarter}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              >
                <option value="Quarter 1">Quarter 1</option>
                <option value="Quarter 2">Quarter 2</option>
                <option value="Quarter 3">Quarter 3</option>
                <option value="Quarter 4">Quarter 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Marks Obtained *</label>
                <input
                  name="marksObtained"
                  required
                  type="number"
                  value={form.marksObtained}
                  onChange={handleInput}
                  placeholder="e.g. 85"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Max Base Score *</label>
                <input
                  name="maxMarks"
                  required
                  type="number"
                  value={form.maxMarks}
                  onChange={handleInput}
                  placeholder="e.g. 100"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Grade Remarks / Comments</label>
              <input
                name="remarks"
                value={form.remarks}
                onChange={handleInput}
                placeholder="e.g. Exhibited strong analytical grasp in quizzes..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400">
              * Immediate translation calculation: <span className="font-mono text-slate-600 font-extrabold">{form.marksObtained && form.maxMarks ? ((Number(form.marksObtained)/Number(form.maxMarks))*100).toFixed(0)+'%' : 'N/A'}</span> (Pass mark requirement is 50%)
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
            >
              Commit Marks
            </button>
          </div>
        </form>
      )}

      {/* Global Academic Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 text-xs justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Quarter selection */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-bold uppercase text-[9px] mr-1">Period:</span>
            <select
              value={selectedQuarterFilter}
              onChange={e => setSelectedQuarterFilter(e.target.value as any)}
              className="bg-transparent border-none py-0.5 outline-none font-bold text-slate-700 cursor-pointer"
            >
              <option value="Quarter 1">Quarter 1</option>
              <option value="Quarter 2">Quarter 2</option>
              <option value="Quarter 3">Quarter 3</option>
              <option value="Quarter 4">Quarter 4</option>
            </select>
          </div>

          {currentViewMode === 'rankings' ? (
            /* Class Selector specifically for Section Leaderboards */
            <div className="flex items-center gap-1.5 bg-indigo-50/55 border border-indigo-100/50 rounded-xl px-3 py-1.5">
              <span className="text-indigo-500 font-bold uppercase text-[9px] mr-1">Section:</span>
              <select
                value={selectedClassIdFilter}
                onChange={e => setSelectedClassIdFilter(e.target.value)}
                className="bg-transparent border-none py-0.5 outline-none font-bold text-indigo-700 cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subjectName} ({s.className})</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="bg-slate-50 text-slate-500 font-mono tracking-wider font-semibold text-[9px] uppercase px-3 py-1.5 rounded-lg border border-slate-100/30">
          {currentViewMode === 'rankings' 
            ? `${calculatedRankings.length} Section Candidates Ranked`
            : `Showing ${filteredAssessments.length} Approved Entries`
          }
        </div>
      </div>

      {currentViewMode === 'rankings' ? (
        /* ==================== SCREEN 2: RANKINGS LEADERBOARD ==================== */
        <div className="space-y-6">
          {/* Section Analytics Brief */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Section Total Enrolled</span>
                <strong className="text-xl font-bold text-slate-800 mt-1 block">{calculatedRankings.length}</strong>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] block font-bold uppercase text-emerald-600">Passing Students</span>
                <strong className="text-xl font-bold text-emerald-700 mt-1 block">{passingRankings}</strong>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl animate-pulse">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] block font-bold uppercase text-rose-600">Failing (Under 50%)</span>
                <strong className="text-xl font-bold text-rose-700 mt-1 block">{failingRankings}</strong>
              </div>
              <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Pass Rate Percentage</span>
                <strong className="text-xl font-bold text-slate-800 mt-1 block">
                  {calculatedRankings.length > 0 
                    ? Math.round((passingRankings / (passingRankings + failingRankings || 1)) * 100) 
                    : 100}%
                </strong>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Section Ranking Leaderboard ({selectedQuarterFilter})
              </h4>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full font-mono mt-0.5">ADMIN REVISE MODE LIVE</span>
            </div>

            {calculatedRankings.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No student grade roster available for this section.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-4 pl-6 text-center w-20">Rank</th>
                      <th className="p-4">Student Profile</th>
                      <th className="p-4">Reg No</th>
                      <th className="p-4">Subjects Graded</th>
                      <th className="p-4">Total Margin</th>
                      <th className="p-4 text-right pr-6">Average Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {calculatedRankings.map((item) => (
                      <tr key={item.studentId} className={`hover:bg-slate-50/20 transition-colors ${item.rank === 1 ? 'bg-amber-50/10' : ''}`}>
                        <td className="p-4 pl-6 text-center font-extrabold text-sm font-mono text-slate-800">
                          {item.rank ? (
                            <span className={`inline-block px-2.5 py-1 rounded ${
                              item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              item.rank === 2 ? 'bg-slate-100 text-slate-800' :
                              item.rank === 3 ? 'bg-orange-50 text-orange-850' : 'text-slate-500'
                            }`}>
                              #{item.rank}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-normal">--</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {item.fullName}
                            {item.rank === 1 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-[10px]">{item.registrationNo}</td>
                        <td className="p-4 text-slate-500 font-bold">{item.gradesCount} Subjects</td>
                        <td className="p-4 font-semibold text-slate-800">
                          {item.gradesCount > 0 ? `${item.totalObtained} / ${item.totalMax}` : 'No records'}
                        </td>
                        <td className="p-4 text-right pr-6">
                          {item.gradesCount > 0 ? (
                            <div className="inline-flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                                item.avgPct >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                item.avgPct >= 50 ? 'bg-indigo-50 text-indigo-700' : 
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {item.avgPct.toFixed(1)}% ({item.passStatus})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono">Unrated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== SCREEN 1: ROSTER SPREADSHEET ==================== */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-slate-50/55 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Approved Grade Registry Entries ({selectedQuarterFilter})
            </h4>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No academic score journals found matching filters on {selectedQuarterFilter}.
            </div>
          ) : (
            <div className="overflow-x-auto animate-fadeIn">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4 pl-6">Student Name</th>
                    <th className="p-4">Subject Course</th>
                    <th className="p-4">Mark Score</th>
                    <th className="p-4">Letter</th>
                    <th className="p-4">Result</th>
                    <th className="p-4">Remarks & Logs</th>
                    <th className="p-4 pr-6 text-right w-44">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAssessments.map((record) => {
                    const isEditing = editingId === record.id;
                    const recordPercentage = record.maxMarks > 0 ? (record.marksObtained / record.maxMarks) * 100 : 0;
                    const isPassing = recordPercentage >= 50;

                    return (
                      <tr key={record.id} className={`hover:bg-slate-50/20 transition-all ${isEditing ? 'bg-indigo-50/10' : ''}`}>
                        <td className="p-4 pl-6 font-bold text-slate-800">
                          {record.studentName}
                        </td>
                        <td className="p-4 font-semibold text-indigo-700">
                          {record.subjectName}
                        </td>

                        {/* Mark score column */}
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className="w-14 bg-white border border-slate-250 p-1 font-bold text-center rounded-lg"
                                value={editForm.marksObtained}
                                onChange={e => setEditForm({ ...editForm, marksObtained: Number(e.target.value) })}
                              />
                              <span className="text-slate-400 font-semibold font-mono">/</span>
                              <input
                                type="number"
                                className="w-14 bg-white border border-slate-250 p-1 font-bold text-center rounded-lg"
                                value={editForm.maxMarks}
                                onChange={e => setEditForm({ ...editForm, maxMarks: Number(e.target.value) })}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>{record.marksObtained} / {record.maxMarks || 100}</span>
                              <span className="font-mono text-[10px] text-slate-400 font-medium">({recordPercentage.toFixed(0)}%)</span>
                            </div>
                          )}
                        </td>

                        {/* Letter Grade */}
                        <td className="p-4 font-extrabold font-mono text-xs">
                          {isEditing ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                              {calculateGradeFromMarks(editForm.marksObtained, editForm.maxMarks)}
                            </span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded font-extrabold text-[10px] ${
                              record.grade === 'A+' || record.grade === 'A' || record.grade === 'A-'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : record.grade === 'F' ? 'bg-rose-50 text-rose-800 border border-rose-100' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {record.grade}
                            </span>
                          )}
                        </td>

                        {/* Pass/fail Status */}
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            isPassing ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isPassing ? 'Pass' : 'Fail (Hold)'}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="p-4 max-w-xs truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-250 p-1 rounded-lg"
                              value={editForm.remarks}
                              onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                            />
                          ) : (
                            <span className="text-slate-500 italic">
                              {record.remarks || 'No remarks logged.'}
                            </span>
                          )}
                        </td>

                        {/* Admin Action column */}
                        <td className="p-4 pr-6 text-right">
                          {isEditing ? (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => saveEdit(record.id)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold text-[10px] uppercase cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 px-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-150 border border-slate-100 rounded-lg cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(record)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer transition-colors"
                                title="Edit registry assessment entry"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteGradeRecord(record.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                title="Delete registered grade permanent"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
