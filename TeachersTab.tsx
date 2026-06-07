import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { UserRole } from '../../types';
import { 
  GraduationCap, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  BookOpen, 
  X,
  Layers
} from 'lucide-react';

const STANDARD_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Amharic Language',
  'Biology',
  'Chemistry',
  'Physics',
  'Social Studies',
  'Civics & Ethics',
  'General Science'
];

export default function TeachersTab() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(STANDARD_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form parameters
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    hireDate: new Date().toISOString().split('T')[0],
    bio: '',
    assignedGrade: '',
    assignedSection: '',
    assignedSubjects: [] as string[]
  });

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const [tList, cList, sList] = await Promise.all([
        schoolService.getTeachers(),
        schoolService.getClasses(),
        schoolService.getSubjects().catch(() => [])
      ]);
      setTeachers(tList);
      setClasses(cList);
      
      // Merge retrieved subject names if any are defined on backend
      if (sList && sList.length > 0) {
        const dbNames = sList.map((s: any) => s.subjectName);
        const unique = Array.from(new Set([...dbNames, ...STANDARD_SUBJECTS]));
        setAvailableSubjects(unique);
      }
    } catch (err) {
      console.error('Failed to load teachers roster list.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectCheckboxChange = (subjectName: string) => {
    setForm(prev => {
      const isChecked = prev.assignedSubjects.includes(subjectName);
      const updated = isChecked
        ? prev.assignedSubjects.filter(s => s !== subjectName)
        : [...prev.assignedSubjects, subjectName];
      return { ...prev, assignedSubjects: updated };
    });
  };

  const handleOpenCreateForm = () => {
    setEditingTeacher(null);
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      hireDate: new Date().toISOString().split('T')[0],
      bio: '',
      assignedGrade: '',
      assignedSection: '',
      assignedSubjects: []
    });
    setSuccess('');
    setError('');
    setShowForm(true);
  };

  const handleOpenEditForm = (teacher: any) => {
    setEditingTeacher(teacher);
    setForm({
      fullName: teacher.fullName,
      email: teacher.email,
      password: '', // Blank by default when editing
      phone: teacher.phone || '',
      specialization: teacher.specialization || '',
      hireDate: teacher.hireDate || new Date().toISOString().split('T')[0],
      bio: teacher.bio || '',
      assignedGrade: teacher.assignedGrade || '',
      assignedSection: teacher.assignedSection || '',
      assignedSubjects: teacher.assignedSubjects || []
    });
    setSuccess('');
    setError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Pre-save validations
    if (!form.fullName || !form.email) {
      setError('Please provide teacher full legal name and email address.');
      return;
    }

    try {
      if (editingTeacher) {
        await schoolService.updateTeacher(editingTeacher.userId, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          specialization: form.specialization,
          hireDate: form.hireDate,
          bio: form.bio,
          assignedGrade: form.assignedGrade,
          assignedSection: form.assignedSection,
          assignedSubjects: form.assignedSubjects
        });
        setSuccess(`Instructor account "${form.fullName}" updated successfully.`);
      } else {
        await schoolService.registerTeacher({
          fullName: form.fullName,
          email: form.email,
          password: form.password || 'teacher123',
          phone: form.phone,
          specialization: form.specialization,
          hireDate: form.hireDate,
          bio: form.bio,
          assignedGrade: form.assignedGrade,
          assignedSection: form.assignedSection,
          assignedSubjects: form.assignedSubjects
        });
        setSuccess(`New educator "${form.fullName}" registered and deployed successfully.`);
      }

      setShowForm(false);
      loadTeachers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save educator details.');
    }
  };

  const handleDeleteTeacher = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to dismiss and delete the teacher record for "${name}"? This action is irreversible and clears their homeroom and subject assignments.`)) {
      return;
    }

    try {
      setSuccess('');
      setError('');
      await schoolService.deleteTeacher(userId);
      setSuccess(`Teacher records for "${name}" have been removed successfully.`);
      loadTeachers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete teacher.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Queuing school personnel rosters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Tutors & Academic Instructors</h3>
          <p className="text-xs text-slate-500 mt-0.5">Deploy, manage, or assign grade responsibilities for Bethelhem Academy educators.</p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
            } else {
              handleOpenCreateForm();
            }
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel Operation' : 'Enlist New Educator'}
        </button>
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

      {/* Onboarding & Edit Form */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-700 uppercase tracking-widest text-[10px]">
              {editingTeacher ? `Modifying Educator Details: ${editingTeacher.fullName}` : 'Academic Unit Onboarding'}
            </h4>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              Close Form
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Full Legal Name *</label>
              <input
                name="fullName"
                required
                value={form.fullName}
                onChange={handleInput}
                placeholder="e.g. Almaz Tesfaye"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Work Email Address *</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleInput}
                placeholder="e.g. almaz.t@bya.edu"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">
                {editingTeacher ? 'Password (Leave Blank to Keep Intact)' : 'Initial Password *'}
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleInput}
                placeholder={editingTeacher ? 'UNCHANGED' : 'Defaults to teacher123'}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Contact Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleInput}
                placeholder="e.g. +251 911 345 678"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Subject Specialization *</label>
              <input
                name="specialization"
                required
                value={form.specialization}
                onChange={handleInput}
                placeholder="e.g. Science, Mathematics"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Hiring Date</label>
              <input
                name="hireDate"
                type="date"
                value={form.hireDate}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Academic Duty Assignments & Authority Level
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Assigned Grade Level</label>
                <select
                  name="assignedGrade"
                  value={form.assignedGrade}
                  onChange={handleInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-medium text-slate-700"
                >
                  <option value="">-- No Assigned Grade --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                    <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Assigned Section</label>
                <select
                  name="assignedSection"
                  value={form.assignedSection}
                  onChange={handleInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors font-medium text-slate-700"
                >
                  <option value="">-- No Assigned Section --</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 block">Assigned Courses & Subjects</label>
              <p className="text-[10px] text-slate-400 mb-2">Check each course subject this educator is authorized to grade or manage.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                {availableSubjects.map((sub, i) => {
                  const checked = form.assignedSubjects.includes(sub);
                  return (
                    <label key={i} className="flex items-center gap-2 cursor-pointer select-none py-1 hover:text-slate-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleSubjectCheckboxChange(sub)}
                        className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-medium text-slate-600">{sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">Short Educator Bio / Experience</label>
            <textarea
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleInput}
              placeholder="Experience and credentials description..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none resize-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
            >
              {editingTeacher ? 'Update Teacher Assignment' : 'Confirm Tutor Deployment'}
            </button>
          </div>
        </form>
      )}

      {/* Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher, idx) => {
          // Identify homeroom class
          const homeroom = classes.find(c => c.tutorId === teacher.userId);

          return (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-250 hover:shadow transition-all relative overflow-hidden group">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{teacher.fullName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wider">{teacher.registrationNo || 'BYA-TCH-ACTIVE'}</span>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditForm(teacher)}
                      title="Edit & Assign Details"
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.userId, teacher.fullName)}
                      title="Delete Teacher"
                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Specialty: <strong className="text-slate-800">{teacher.specialization || 'General Tutor'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]" title={teacher.email}>{teacher.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{teacher.phone || '+251 911 000 000'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Hired: <strong className="font-mono">{teacher.hireDate || '2023-09-01'}</strong></span>
                  </div>
                </div>

                {/* Real Assignments Badging */}
                <div className="border-t border-slate-50 pt-3 space-y-2 text-[10px]">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Grade Assignment:</span>
                    {teacher.assignedGrade ? (
                      <span className="mt-1 inline-block bg-teal-50 border border-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                        {teacher.assignedGrade} {teacher.assignedSection ? `- Section ${teacher.assignedSection}` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No assigned grade section</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Assigned Subjects:</span>
                    {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.assignedSubjects.map((sub: string, i: number) => (
                          <span key={i} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-600">
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic block mt-0.5">No assigned subjects</span>
                    )}
                  </div>
                </div>

                {teacher.bio && (
                  <p className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic mt-3 leading-relaxed">
                    "{teacher.bio}"
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Tutor Designation
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                  homeroom || teacher.assignedGrade ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                }`}>
                  {homeroom ? `Homeroom: ${homeroom.className}-${homeroom.section}` : teacher.assignedGrade ? `Homeroom: ${teacher.assignedGrade}` : 'General / Substitute'}
                </span>
              </div>
            </div>
          );
        })}

        {teachers.length === 0 && (
          <div className="col-span-full p-12 bg-slate-50 text-center rounded-3xl border border-dashed border-slate-200 text-slate-400 font-semibold text-xs text-slate-400">
            No active deployed educators found in records. Dismissed or empty database.
          </div>
        )}
      </div>
    </div>
  );
}
