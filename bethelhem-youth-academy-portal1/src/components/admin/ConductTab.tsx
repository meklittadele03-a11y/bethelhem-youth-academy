import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, HelpCircle, Edit3, Trash2, AlertTriangle, CheckCircle, Search, PlusCircle, X } from 'lucide-react';

export default function ConductTab() {
  const { user } = useAuth();
  const [conductRecords, setConductRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');

  // New record form state
  const [form, setForm] = useState({
    studentId: '',
    conductScore: 'Excellent' as 'Excellent' | 'Good' | 'Needs Improvement',
    incidentDate: new Date().toISOString().split('T')[0],
    description: '',
    reportedBy: ''
  });

  // Edit record form state
  const [editForm, setEditForm] = useState({
    conductScore: 'Excellent' as 'Excellent' | 'Good' | 'Needs Improvement',
    incidentDate: '',
    description: '',
    reportedBy: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [conductList, stuList, classesList, teachersList] = await Promise.all([
        schoolService.getConduct(),
        schoolService.getStudents(),
        schoolService.getClasses(),
        schoolService.getTeachers()
      ]);
      setConductRecords(conductList);
      setStudents(stuList);
      setClasses(classesList);
      setTeachers(teachersList);

      // Determine initial student in form dropdown based on authorization filters
      const allowedStudents = getAllowedStudents(stuList, teachersList, classesList);
      if (allowedStudents.length > 0) {
        setForm(prev => ({ ...prev, studentId: allowedStudents[0].userId }));
      }
    } catch (err) {
      console.error('Failed to load conduct registries.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Determine which teacher profile corresponds to the current logged-in user
  const getTeacherProfile = (allTeachers: any[]) => {
    if (!user || user.role !== 'teacher') return null;
    return allTeachers.find(t => t.userId === user.id);
  };

  // Filter students that the current logged in user has access to log conduct for
  const getAllowedStudents = (allStudents: any[], allTeachers: any[], allClasses: any[]) => {
    if (!user) return [];
    if (user.role === 'admin') return allStudents;

    if (user.role === 'teacher') {
      const teacherProfile = getTeacherProfile(allTeachers);
      if (!teacherProfile) return [];

      return allStudents.filter(s => {
        // Find student class details
        const studentClass = allClasses.find(c => c.id === s.classId);
        return (
          studentClass &&
          teacherProfile.assignedGrade === studentClass.className &&
          teacherProfile.assignedSection === studentClass.section
        );
      });
    }

    return [];
  };

  // Check if current user can manage (edit/delete) a specific conduct record
  const checkCanManageRecord = (record: any) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    if (user.role === 'teacher') {
      const teacherProfile = getTeacherProfile(teachers);
      if (!teacherProfile) return false;

      const studentObj = students.find(s => s.userId === record.studentId);
      if (!studentObj) return false;

      const studentClass = classes.find(c => c.id === studentObj.classId);
      return (
        studentClass &&
        teacherProfile.assignedGrade === studentClass.className &&
        teacherProfile.assignedSection === studentClass.section
      );
    }

    return false;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitConduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.studentId) {
      setError('Please select a student.');
      return;
    }

    if (!form.description.trim()) {
      setError('Please provide comments/remarks describing the conduct.');
      return;
    }

    try {
      const studentObj = students.find(s => s.userId === form.studentId);
      await schoolService.submitConduct({
        studentId: form.studentId,
        studentName: studentObj ? studentObj.fullName : 'Student',
        conductScore: form.conductScore,
        incidentDate: form.incidentDate,
        description: form.description,
        reportedBy: form.reportedBy || user?.fullName || 'Academic Instructor'
      });

      setSuccess('Student conduct grade and comments recorded successfully.');
      setForm(prev => ({
        ...prev,
        description: '',
        reportedBy: ''
      }));
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save student conduct details.');
    }
  };

  const startEdit = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      conductScore: record.conductScore,
      incidentDate: record.incidentDate,
      description: record.description,
      reportedBy: record.reportedBy
    });
    setSuccess('');
    setError('');
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!editForm.description.trim()) {
      setError('Please provide comments or details.');
      return;
    }

    try {
      await schoolService.updateConduct(editingRecord.id, {
        conductScore: editForm.conductScore,
        incidentDate: editForm.incidentDate,
        description: editForm.description,
        reportedBy: editForm.reportedBy || user?.fullName || 'Academic Instructor'
      });

      setSuccess('Conduct record modified successfully.');
      setEditingRecord(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update behavior details.');
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this conduct record?')) return;
    setSuccess('');
    setError('');

    try {
      await schoolService.deleteConduct(id);
      setSuccess('Conduct record removed successfully.');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete behavior log.');
    }
  };

  const allowedStudents = getAllowedStudents(students, teachers, classes);

  const filteredRecords = conductRecords.filter(r => {
    // Only display records appropriate for the role output
    let fitsAccess = true;
    if (user?.role === 'teacher') {
      const tProfile = getTeacherProfile(teachers);
      if (tProfile) {
        const studentObj = students.find(s => s.userId === r.studentId);
        const sClass = classes.find(c => c.id === studentObj?.classId);
        fitsAccess = !!(sClass && tProfile.assignedGrade === sClass.className && tProfile.assignedSection === sClass.section);
      } else {
        fitsAccess = false;
      }
    }

    const matchesSearch = !search || r.studentName.toLowerCase().includes(search.toLowerCase()) || r.reportedBy.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !scoreFilter || r.conductScore === scoreFilter;
    return fitsAccess && matchesSearch && matchesFilter;
  });

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Good': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Needs Improvement': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const getGradeLetter = (score: string) => {
    switch (score) {
      case 'Excellent': return 'A';
      case 'Good': return 'B';
      case 'Needs Improvement': return 'C';
      default: return 'C';
    }
  };

  const teacherProfile = getTeacherProfile(teachers);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Reviewing conduct scoring registry...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs" id="conduct-discipline-module">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Student Conduct & Honor Deck</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === 'teacher' ? (
              <span>Managing conduct logs and comments for your assigned section: <strong>{teacherProfile?.assignedGrade} {teacherProfile?.assignedSection}</strong></span>
            ) : (
              <span>Audit discipline logs, reward merits, and verify academic evaluations.</span>
            )}
          </p>
        </div>

        <button
          id="btn-file-conduct"
          onClick={() => {
            setEditingRecord(null);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          {showAddForm ? 'Hide Form' : 'Record Student Conduct'}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center gap-3" id="alert-success">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl flex items-center gap-3" id="alert-error">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Record Conduct Form */}
      {showAddForm && (
        <form onSubmit={submitConduct} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="form-record-conduct">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-750 uppercase tracking-wider text-[10px]">Academic Conduct Entry</h4>
            <span className="text-[10px] text-slate-400 font-mono">Role: {user?.role === 'admin' ? 'Administrator' : 'Assigned Tutor'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Select Student *</label>
              <select
                name="studentId"
                id="select-student"
                value={form.studentId}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold text-slate-700"
              >
                {allowedStudents.length === 0 ? (
                  <option value="">No authorized students available</option>
                ) : (
                  allowedStudents.map(s => {
                    const stuClass = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.userId}>
                        {s.fullName} ({stuClass ? `${stuClass.className} - Section ${stuClass.section}` : 'N/A'})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Conduct Grade Rating *</label>
              <select
                name="conductScore"
                id="select-grade"
                value={form.conductScore}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold text-slate-750"
              >
                <option value="Excellent">A = Excellent</option>
                <option value="Good">B = Good</option>
                <option value="Needs Improvement">C = Needs Improvement</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Incident / Appraisal Date *</label>
              <input
                name="incidentDate"
                type="date"
                required
                value={form.incidentDate}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Reporting Officer / Observer</label>
              <input
                name="reportedBy"
                value={form.reportedBy}
                onChange={handleInput}
                placeholder={user?.fullName || "e.g. Almaz Tesfaye"}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Tutor Comments & Remarks *</label>
              <textarea
                name="description"
                required
                rows={2}
                value={form.description}
                onChange={handleInput}
                placeholder="Detail the student's behavior or specific academic conduct observations..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none resize-none focus:bg-white focus:border-emerald-600 transition-colors text-slate-755"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={allowedStudents.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Conduct Evaluation
            </button>
          </div>
        </form>
      )}

      {/* Edit Conduct Modal/Pop-up */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 backdrop-blur-sm">
          <form onSubmit={submitEdit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-4 max-w-xl w-full" id="form-edit-conduct">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Edit Conduct Evaluation</h4>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Student Record Under Assessment</div>
              <div className="text-sm font-extrabold text-slate-800 mt-0.5">{editingRecord.studentName}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Conduct Grade Rating *</label>
                <select
                  name="conductScore"
                  value={editForm.conductScore}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold text-slate-750"
                >
                  <option value="Excellent">A = Excellent</option>
                  <option value="Good">B = Good</option>
                  <option value="Needs Improvement">C = Needs Improvement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Incident / Assessment Date *</label>
                <input
                  name="incidentDate"
                  type="date"
                  required
                  value={editForm.incidentDate}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Reporting Officer / Observer</label>
              <input
                name="reportedBy"
                value={editForm.reportedBy}
                onChange={handleEditInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Tutor Comments & Remarks *</label>
              <textarea
                name="description"
                required
                rows={3}
                value={editForm.description}
                onChange={handleEditInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none resize-none focus:bg-white focus:border-emerald-600 transition-colors text-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2 rounded-xl cursor-pointer shadow-md"
              >
                Save Observations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name or observer..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={scoreFilter}
            onChange={e => setScoreFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          >
            <option value="">All Ratings</option>
            <option value="Excellent">♻ Grade A (Excellent)</option>
            <option value="Good">⚙ Grade B (Good)</option>
            <option value="Needs Improvement">⚠ Grade C (Needs Improvement)</option>
          </select>
        </div>

        <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
          Evaluated Logs: {filteredRecords.length}
        </div>
      </div>

      {/* Conduct Logs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((record) => {
          const studentObj = students.find(s => s.userId === record.studentId);
          const studentClass = classes.find(c => c.id === studentObj?.classId);
          const classNameText = studentClass ? `${studentClass.className} - ${studentClass.section}` : '';
          const canManage = checkCanManageRecord(record);

          return (
            <div key={record.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{record.studentName}</h4>
                    {classNameText && (
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mt-0.5">{classNameText}</span>
                    )}
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{record.incidentDate}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${getScoreColor(record.conductScore)}`}>
                      Grade {getGradeLetter(record.conductScore)} · {record.conductScore}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-2xl text-[10px] text-slate-600 leading-relaxed border border-slate-100/30 font-mono">
                  <div className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">Tutor Observations</div>
                  <p className="italic">"{record.description}"</p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[9px]">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold">By: </span>
                  <strong className="text-slate-600">{record.reportedBy}</strong>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(record)}
                      className="p-1 px-2 rounded hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1 font-bold"
                      title="Edit behavioral evaluations"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-1 px-2 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all flex items-center gap-1 font-bold"
                      title="Remove behavioral log item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="col-span-full bg-white border border-slate-100 p-12 text-center rounded-3xl text-slate-400">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No conduct logs found.
          </div>
        )}
      </div>
    </div>
  );
}
