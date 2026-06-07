import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { ClassSection, AttendanceRecord } from '../../types';
import { Clock, Check, X, AlertCircle, AlertTriangle, Filter, Search, Calendar, Save, CheckCircle2 } from 'lucide-react';

export default function AttendanceTab() {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>('morning');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const classList = await schoolService.getClasses();
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err) {
      console.error('Failed to retrieve class directory.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadAttendanceAndStudents = async () => {
    if (!selectedClassId) return;
    try {
      setLoading(true);
      setSuccess('');
      setError('');
      // Load student list
      const studentsList = await schoolService.getStudents();
      // Filter student profiles in class
      const targetClass = classes.find(c => c.id === selectedClassId);
      const filteredStudents = studentsList.filter((s: any) => s.classId === selectedClassId);

      // Fetch attendance statistics
      const attLogs = await schoolService.getAttendance(selectedClassId, attendanceDate, selectedSession);

      // For every student, build a default present attendance record if none is saved
      const finalRecords = filteredStudents.map((s: any) => {
        const existingLog = attLogs.find((l: any) => l.studentId === s.userId);
        return {
          studentId: s.userId,
          studentName: s.fullName,
          classId: selectedClassId,
          date: attendanceDate,
          session: selectedSession,
          status: existingLog ? existingLog.status : 'Present',
          remarks: existingLog ? existingLog.remarks : '',
          logId: existingLog ? existingLog.id : null
        };
      });

      setStudents(filteredStudents);
      setAttendanceRecords(finalRecords);
    } catch (err) {
      console.error('Failed to load class attendance matrix.', err);
      setError('Could not query corresponding school registry records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceAndStudents();
  }, [selectedClassId, attendanceDate, selectedSession, classes]);

  const updateStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setAttendanceRecords(prev =>
      prev.map(r => r.studentId === studentId ? { ...r, status } : r)
    );
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev =>
      prev.map(r => r.studentId === studentId ? { ...r, remarks } : r)
    );
  };

  const saveAttendance = async () => {
    try {
      setSubmitting(true);
      setSuccess('');
      setError('');

      await Promise.all(
        attendanceRecords.map(record =>
          schoolService.submitAttendance({
            studentId: record.studentId,
            studentName: record.studentName,
            classId: record.classId,
            date: record.date,
            session: selectedSession,
            status: record.status,
            remarks: record.remarks
          })
        )
      );

      setSuccess('Daily roll call parameters updated & persistent across records.');
      // Reload matching status
      loadAttendanceAndStudents();
    } catch (err) {
      console.error('Could not save attendance state.', err);
      setError('Failed to persist attendance directory logs.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-50 border border-emerald-100 text-emerald-700';
      case 'Absent': return 'bg-rose-50 border border-rose-100 text-rose-700';
      case 'Late': return 'bg-amber-50 border border-amber-100 text-amber-700';
      default: return 'bg-sky-50 border border-sky-100 text-sky-700';
    }
  };

  // Calculate metrics
  const total = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Reviewing school attendance roll...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">School Attendance Deck</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track, write or audit primary student daily roll calls.</p>
        </div>

        <button
          onClick={saveAttendance}
          disabled={submitting || attendanceRecords.length === 0}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          {submitting ? 'Syncing...' : 'Save Roll Call'}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Metrics Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            Selection Parameters
          </div>
          
          <div className="space-y-3 text-xs">
            {/* Class Field */}
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">Assigned Section</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className} - Section {c.section} ({c.roomNo})</option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">Calendar Index Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:focus:ring-1 focus:focus:ring-emerald-600 transition-colors"
              />
            </div>

            {/* Session Switcher */}
            <div className="space-y-1">
              <label className="text-slate-500 font-bold block">Active Session</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedSession('morning')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSession === 'morning'
                      ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Morning
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSession('afternoon')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSession === 'afternoon'
                      ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Afternoon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Rates Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Operational Analytics</span>
            <h4 className="font-extrabold text-slate-800 text-sm mt-1">Class Statistics Summary</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-4 text-center">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Enrolled</span>
              <strong className="block text-xl font-bold text-slate-800 mt-1">{total}</strong>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-100/30 rounded-xl p-4 text-center">
              <span className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">Present Count</span>
              <strong className="block text-xl font-bold text-emerald-700 mt-1">{presentCount}</strong>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-100/30 rounded-xl p-4 text-center">
              <span className="text-[9px] text-indigo-600 uppercase font-bold tracking-wider">Attendance Rate</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <strong className={`text-xl font-bold ${rate >= 90 ? 'text-emerald-700' : 'text-amber-600'}`}>{rate}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Roster Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
        {attendanceRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
            No registered students enrolled in selected class section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4 text-center">Clearance Status</th>
                  <th className="p-4">Remarks & Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceRecords.map((record) => (
                  <tr key={record.studentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">
                      {record.studentName}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        {[
                          { id: 'Present', label: 'Present', color: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600' },
                          { id: 'Absent', label: 'Absent', color: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600' },
                          { id: 'Late', label: 'Late', color: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' },
                          { id: 'Excused', label: 'Excused', color: 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600' }
                        ].map(st => {
                          const isSel = record.status === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => updateStatus(record.studentId, st.id as any)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all border cursor-pointer ${
                                isSel
                                  ? `${st.color} shadow-sm shadow-slate-100`
                                  : 'bg-slate-50 text-slate-500 border-slate-250 hover:bg-slate-100'
                              }`}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <input
                        value={record.remarks}
                        onChange={e => updateRemarks(record.studentId, e.target.value)}
                        placeholder="e.g. excused sick leave with paper..."
                        className="w-full bg-slate-50 outline-none hover:bg-slate-100/50 border border-transparent focus:border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 transition-all text-[11px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
