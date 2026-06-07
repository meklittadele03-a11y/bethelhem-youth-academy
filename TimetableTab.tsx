import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { ClassSection } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Check,
  AlertCircle,
  X,
  Search,
  BookOpen,
  MapPin,
  UserCheck,
  User
} from 'lucide-react';

export default function TimetableTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Core Data Lists
  const [timetables, setTimetables] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Mode States
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);

  // Timetable Display Modes / Filters
  // 'section' (Class / Section based) or 'teacher' (Teacher based)
  const [viewMode, setViewMode] = useState<'section' | 'teacher'>('section');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');

  // Form states (creating a slot)
  const [form, setForm] = useState({
    classId: '',
    subjectName: '',
    dayOfWeek: 'Monday' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
    startTime: '08:30 AM',
    endTime: '10:00 AM',
    teacherName: '',
    roomNo: ''
  });

  // Edit form states (modifying a slot)
  const [editForm, setEditForm] = useState({
    classId: '',
    subjectName: '',
    dayOfWeek: 'Monday' as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
    startTime: '08:30 AM',
    endTime: '10:00 AM',
    teacherName: '',
    roomNo: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tableList, clList, tcList, stList] = await Promise.all([
        schoolService.getTimetables(),
        schoolService.getClasses(),
        schoolService.getTeachers(),
        schoolService.getStudents()
      ]);
      setTimetables(tableList);
      setClasses(clList);
      setTeachers(tcList);
      setStudents(stList);

      // Determine default class/section for forms
      if (clList.length > 0) {
        setForm(prev => ({ ...prev, classId: clList[0].id }));
      }

      // Configure default filters depending on logged-in user role
      if (user?.role === 'teacher') {
        const matchingTeacher = tcList.find((t: any) => t.userId === user.id);
        const nameToFilter = matchingTeacher ? matchingTeacher.fullName : user.fullName;
        setSelectedTeacherName(nameToFilter);
        setViewMode('teacher');
      } else if (user?.role === 'student') {
        const studentProfile = stList.find((s: any) => s.userId === user.id);
        if (studentProfile && studentProfile.classId) {
          setSelectedClassId(studentProfile.classId);
        } else if (clList.length > 0) {
          setSelectedClassId(clList[0].id);
        }
        setViewMode('section');
      } else if (user?.role === 'parent') {
        // Find children
        const children = stList.filter((s: any) => s.parentId === user.id);
        if (children.length > 0 && children[0].classId) {
          setSelectedClassId(children[0].classId);
        } else if (clList.length > 0) {
          setSelectedClassId(clList[0].id);
        }
        setViewMode('section');
      } else {
        // Admin
        if (clList.length > 0) {
          setSelectedClassId(clList[0].id);
        }
        if (tcList.length > 0) {
          setSelectedTeacherName(tcList[0].fullName);
        }
        setViewMode('section');
      }

    } catch (err) {
      console.error('Failed to queryWeekly timetables schedule.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.subjectName.trim() || !form.teacherName.trim() || !form.roomNo.trim()) {
      setError('Please provide subject name, designated tutor, and Classroom Number.');
      return;
    }

    try {
      const selectedClass = classes.find(c => c.id === form.classId);
      const classNameStr = selectedClass ? `${selectedClass.className}-${selectedClass.section}` : 'General Class';

      await schoolService.submitTimetable({
        classId: form.classId,
        className: classNameStr,
        subjectName: form.subjectName,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        teacherName: form.teacherName,
        roomNo: form.roomNo
      });

      setSuccess('Weekly schedule slot saved successfully with zero conflicts.');
      // Keep state values but clear subject/teacher/room
      setForm(prev => ({
        ...prev,
        subjectName: '',
        teacherName: '',
        roomNo: ''
      }));
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to insert school calendar item due to internal clashes.');
    }
  };

  const startEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditForm({
      classId: entry.classId || (classes.length > 0 ? classes[0].id : ''),
      subjectName: entry.subjectName,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      teacherName: entry.teacherName,
      roomNo: entry.roomNo
    });
    setSuccess('');
    setError('');
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!editForm.subjectName.trim() || !editForm.teacherName.trim() || !editForm.roomNo.trim()) {
      setError('Please provide subject name, tutor, and room info.');
      return;
    }

    try {
      const selectedClass = classes.find(c => c.id === editForm.classId);
      const classNameStr = selectedClass ? `${selectedClass.className}-${selectedClass.section}` : 'General Class';

      await schoolService.updateTimetable(editingEntry.id, {
        classId: editForm.classId,
        className: classNameStr,
        subjectName: editForm.subjectName,
        dayOfWeek: editForm.dayOfWeek,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        teacherName: editForm.teacherName,
        roomNo: editForm.roomNo
      });

      setSuccess('Weekly schedule slot updated successfully with conflict verification checks verified.');
      setEditingEntry(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save timetable adjustments.');
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this weekly timetable slot?')) return;
    try {
      setSuccess('');
      setError('');
      await schoolService.deleteTimetable(id);
      setSuccess('Timetable slot successfully removed.');
      loadData();
    } catch (err) {
      setError('Failed to clear scheduling resource item.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Aligning scholastic timetable rosters...
      </div>
    );
  }

  // Days list mapping
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ];

  // Get active timetables filtered by viewMode
  const filteredTimetables = timetables.filter(item => {
    if (viewMode === 'section') {
      return item.classId === selectedClassId;
    } else {
      return item.teacherName?.toLowerCase() === selectedTeacherName?.toLowerCase();
    }
  });

  return (
    <div className="space-y-6 text-xs" id="timetable-scheduling-deck">
      {/* Header section with view toggle */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Weekly Lecture Schedule Planners</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate course rosters, prevent instructor collisions, and designate classrooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Toggles */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            <button
              onClick={() => setViewMode('section')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider ${
                viewMode === 'section'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Class-Based Grid
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider ${
                viewMode === 'teacher'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              Teacher-Based Grid
            </button>
          </div>

          {/* Context selection filter */}
          {viewMode === 'section' ? (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-755 font-semibold rounded-xl px-3 py-2 outline-none"
            >
              <option value="">-- Choose Class Section --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.className} - {c.section} (Room {c.roomNo})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedTeacherName}
              onChange={e => setSelectedTeacherName(e.target.value)}
              className="bg-white border border-slate-200 text-slate-755 font-semibold rounded-xl px-3 py-2 outline-none"
            >
              <option value="">-- Choose Instructor --</option>
              {/* Derive unique teacher names */}
              {teachers.map((t: any) => (
                <option key={t.id} value={t.fullName}>
                  {t.fullName} ({t.specialization || 'Tutor'})
                </option>
              ))}
              {/* Fallback to non-profile teachers listed in timetable if any */}
              {Array.from(new Set(timetables.map(t => t.teacherName)))
                .filter(name => !teachers.some(t => t.fullName === name))
                .map(name => (
                  <option key={name} value={name}>
                    {name} (Tutor Room)
                  </option>
                ))}
            </select>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setEditingEntry(null);
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              {showForm ? 'Hide Form' : 'Add Schedule Slot'}
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center gap-3 animate-fade-in" id="timetable-success-banner">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl flex items-center gap-3 animate-fade-in" id="timetable-error-banner">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* CREATE FORM (ADMIN ONLY) */}
      {showForm && isAdmin && (
        <form onSubmit={submitTimetable} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4" id="form-create-timetable">
          <div className="border-b border-slate-100 pb-2 mb-2">
            <h4 className="font-extrabold text-slate-700 uppercase tracking-widest text-[10px]">Add New Academic Schedule Slot</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Class Section *</label>
              <select
                name="classId"
                value={form.classId}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Course / Subject *</label>
              <input
                name="subjectName"
                required
                value={form.subjectName}
                onChange={handleInput}
                placeholder="e.g. Mathematics, English"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors text-slate-755 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Active Day *</label>
              <select
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Assigned Classroom Room *</label>
              <input
                name="roomNo"
                required
                value={form.roomNo}
                onChange={handleInput}
                placeholder="e.g. Room 201"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Scheduled Start Time *</label>
              <input
                name="startTime"
                required
                value={form.startTime}
                onChange={handleInput}
                placeholder="e.g. 08:30 AM"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Scheduled End Time *</label>
              <input
                name="endTime"
                required
                value={form.endTime}
                onChange={handleInput}
                placeholder="e.g. 10:00 AM"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Instructing Educator Name *</label>
              <input
                name="teacherName"
                required
                value={form.teacherName}
                onChange={handleInput}
                placeholder="e.g. Almaz Tesfaye"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
            >
              Store Schedule Slot
            </button>
          </div>
        </form>
      )}

      {/* EDIT MODAL / FORM (ADMIN ONLY) */}
      {editingEntry && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <form onSubmit={submitEdit} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-2xl max-w-2xl w-full space-y-4" id="form-edit-timetable">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Modify Timetable Arrangement</h4>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Modifying Subject Slot</div>
                <div className="text-sm font-extrabold text-slate-800 mt-0.5">{editingEntry.subjectName}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                {editingEntry.className}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Class Section *</label>
                <select
                  name="classId"
                  value={editForm.classId}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Subject *</label>
                <input
                  name="subjectName"
                  required
                  value={editForm.subjectName}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Active Day *</label>
                <select
                  name="dayOfWeek"
                  value={editForm.dayOfWeek}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Room Number *</label>
                <input
                  name="roomNo"
                  required
                  value={editForm.roomNo}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Educator / Tutor *</label>
                <input
                  name="teacherName"
                  required
                  value={editForm.teacherName}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Scheduled Start Time *</label>
                <input
                  name="startTime"
                  required
                  value={editForm.startTime}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Scheduled End Time *</label>
                <input
                  name="endTime"
                  required
                  value={editForm.endTime}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2 rounded-xl cursor-pointer shadow-md"
              >
                Apply Timetable Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Responsive Weekly Planner View Matrix */}
      <div className="space-y-6">
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700">
              {viewMode === 'section' ? 'Active Schedule for Class Section' : 'Weekly Calendar for Instructor'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2 rounded-full uppercase">
            {viewMode === 'section'
              ? classes.find(c => c.id === selectedClassId)
                ? `${classes.find(c => c.id === selectedClassId)?.className} - ${classes.find(c => c.id === selectedClassId)?.section}`
                : 'No Class Selected'
              : selectedTeacherName || 'No Teacher Selected'}
          </span>
        </div>

        {days.map(day => {
          const itemsForDay = filteredTimetables.filter(item => item.dayOfWeek === day);

          // Sort items by start time
          itemsForDay.sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={day} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-50 text-slate-800 font-bold text-xs uppercase tracking-wider font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {day}
              </div>

              {itemsForDay.length === 0 ? (
                <p className="text-slate-400 font-medium italic py-2 pl-3">
                  No courses or assessments mapped for {day}.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itemsForDay.map(item => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-250 hover:bg-slate-50/40 transition-all flex justify-between items-start"
                    >
                      <div className="space-y-2">
                        <div className="flex gap-1.5 items-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                            {item.className}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200/60 text-slate-600 font-mono">
                            {item.roomNo}
                          </span>
                        </div>

                        <div>
                          <strong className="block text-slate-800 text-xs font-bold leading-snug">{item.subjectName}</strong>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {item.teacherName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.startTime} - {item.endTime}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-slate-400 hover:text-emerald-600 p-1 hover:bg-slate-150 rounded transition-colors cursor-pointer"
                            title="Edit section timetable item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeEntry(item.id)}
                            className="text-slate-350 hover:text-rose-500 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
