import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  ShieldAlert, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  UserPlus, 
  X, 
  BadgeInfo, 
  FileText 
} from 'lucide-react';
import { schoolService } from '../../services/api';
import { ClassSection, StudentProfile } from '../../types';

export default function StudentsTab() {
  // Query & lists state
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  
  // Filtering & Pagination states
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register & Edit states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  
  // Student Profile Overlay state
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'grades' | 'attendance' | 'conduct' | 'parent'>('grades');

  // Form inputs state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    grade: '1',
    section: 'A',
    admissionDate: new Date().toISOString().split('T')[0],
    
    // Parent coupling options
    parentMode: 'existing', // 'existing' | 'new'
    parentId: '',
    parentName: '',
    parentPhone: '',
    parentAddress: '',
    parentOccupation: 'Self-Employed'
  });

  const loadFilterData = async () => {
    try {
      const [classesList, parentsList] = await Promise.all([
        schoolService.getClasses(),
        schoolService.getParents()
      ]);
      setClasses(classesList || []);
      setParents(parentsList || []);
      
      // Default initial parent picker if exists
      if (parentsList && parentsList.length > 0) {
        setFormData(prev => ({ ...prev, parentId: parentsList[0].userId }));
      }
    } catch (err) {
      console.error('Failed to pre-fetch filter tables', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      // We pass the parameters to fetch paginated data from the server
      const res = await schoolService.getStudentsWithFilters({
        search,
        grade: filterGrade ? `Grade ${filterGrade}` : '',
        section: filterSection,
        page: currentPage,
        limit: itemsPerPage
      });

      if (res && res.students !== undefined) {
        setStudentsData(res.students);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.totalCount || 0);
      } else {
        // Fallback to client-side filtering if flat array is returned for backward compatibility
        const flatList = res || [];
        
        let filtered = [...flatList];
        if (search) {
          const sTerm = search.toLowerCase();
          filtered = filtered.filter((s: any) => 
            s.fullName.toLowerCase().includes(sTerm) || 
            s.registrationNo.toLowerCase().includes(sTerm) ||
            (s.parentName && s.parentName.toLowerCase().includes(sTerm))
          );
        }
        if (filterGrade) {
          filtered = filtered.filter((s: any) => s.className && s.className.includes(`Grade ${filterGrade}`));
        }
        if (filterSection) {
          filtered = filtered.filter((s: any) => s.className && s.className.toLowerCase().endsWith(`-${filterSection.toLowerCase()}`));
        }

        setTotalItems(filtered.length);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1);
        const start = (currentPage - 1) * itemsPerPage;
        setStudentsData(filtered.slice(start, start + itemsPerPage));
      }
    } catch (err: any) {
      console.error('Failed to load student profiles', err);
      setErrorMsg('Could not fetch active student roster from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page on query shift
  }, [search, filterGrade, filterSection]);

  useEffect(() => {
    loadStudents();
  }, [search, filterGrade, filterSection, currentPage]);

  // Load single student profile for visual popup
  const handleViewProfile = async (userId: string) => {
    try {
      setProfileStudentId(userId);
      setProfileLoading(true);
      setProfileActiveTab('grades');
      const details = await schoolService.getStudentProfile(userId);
      setProfileData(details);
    } catch (err) {
      console.error('Error fetching student profile details', err);
      setProfileActiveTab('grades');
      setProfileData({
        fullName: 'Unknown Student',
        registrationNo: 'N/A',
        attendance: [],
        grades: [],
        conduct: []
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Launch pre-populated form edit dialog
  const handleEditClick = (student: any) => {
    setEditStudentId(student.userId);
    const names = student.fullName.split(' ');
    const fName = names[0] || '';
    const lName = names.slice(1).join(' ') || '';

    // Attempt to extract raw numeric grade and section
    let extractedGrade = '1';
    let extractedSection = 'A';
    if (student.className && student.className !== 'Unassigned') {
      const match = student.className.match(/Grade\s*(\d+)-([A-C])/i);
      if (match) {
        extractedGrade = match[1];
        extractedSection = match[2];
      }
    }

    setFormData({
      firstName: fName,
      lastName: lName,
      email: student.email || '',
      phone: student.parentPhone === 'N/A' ? '' : student.parentPhone || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      grade: extractedGrade,
      section: extractedSection,
      admissionDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
      parentMode: 'existing',
      parentId: student.parentId || (parents[0]?.userId || ''),
      parentName: '',
      parentPhone: '',
      parentAddress: '',
      parentOccupation: 'Self-Employed'
    });
    setSuccessMsg('');
    setErrorMsg('');
    setShowFormModal(true);
  };

  // Perform hard delete cascade
  const handleDeleteClick = async (userId: string, name: string) => {
    const doubleCheck = window.confirm(`Are you absolutely sure you want to delete Bethelhem Academy pupil account "${name}"?\nThis action will irrecoverably cascade-delete presence rolls, test scores and behavior marks.`);
    if (!doubleCheck) return;

    try {
      setActionLoading(true);
      await schoolService.deleteStudent(userId);
      setSuccessMsg(`Pupil account "${name}" deleted from systems database successfully.`);
      loadStudents();
    } catch (err: any) {
      console.error('Failed to delete student', err);
      alert(err.response?.data?.error || 'System error deleting student profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit pupil creation or modifications
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.dob) {
      setErrorMsg('Please enter all required student fields correctly.');
      return;
    }

    try {
      setActionLoading(true);
      
      // Resolve class id from Grade selection & Section selection
      const targetClassName = `Grade ${formData.grade}`;
      const matchingClass = classes.find(c => c.className === targetClassName && c.section === formData.section);
      const classId = matchingClass ? matchingClass.id : `c-g${formData.grade}-${formData.section.toLowerCase()}`;

      const payload = {
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        dob: formData.dob,
        gender: formData.gender,
        classId,
        admissionDate: formData.admissionDate,
        
        // Parent coupling payload
        parentId: formData.parentMode === 'existing' ? formData.parentId : undefined,
        createParent: formData.parentMode === 'new',
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentAddress: formData.parentAddress.trim(),
        parentOccupation: formData.parentOccupation
      };

      if (editStudentId) {
        await schoolService.updateStudent(editStudentId, payload);
        setSuccessMsg(`Student profile for "${payload.fullName}" revised successfully.`);
      } else {
        await schoolService.registerStudent(payload);
        setSuccessMsg(`New student "${payload.fullName}" enrolled with secure register ID index.`);
      }

      // Reset Form & reload
      setShowFormModal(false);
      setEditStudentId(null);
      loadStudents();
      loadFilterData(); // Retrieve newly generated parent IDs if any
    } catch (err: any) {
      console.error('Student processing error', err);
      setErrorMsg(err.response?.data?.error || 'Execution aborted on systems boundary.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick state resets
  const openAddModal = () => {
    setEditStudentId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '',
      grade: '1',
      section: 'A',
      admissionDate: new Date().toISOString().split('T')[0],
      parentMode: 'existing',
      parentId: parents[0]?.userId || '',
      parentName: '',
      parentPhone: '',
      parentAddress: '',
      parentOccupation: 'Self-Employed'
    });
    setSuccessMsg('');
    setErrorMsg('');
    setShowFormModal(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Student Management Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">Enroll new pupils, modify class structures, assign sections, and manage parental ties in BYA Addis Ababa.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide px-5 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* FEEDBACK STATUS BAR */}
      {successMsg && (
        <div id="success-feedback" className="bg-emerald-50 text-emerald-800 p-4 border border-emerald-150 rounded-2xl text-xs flex items-center gap-2 transition-all">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <strong className="font-sans">{successMsg}</strong>
        </div>
      )}

      {errorMsg && (
        <div id="error-feedback" className="bg-rose-50 text-rose-800 p-4 border border-rose-150 rounded-2xl text-xs flex items-center gap-2 transition-all">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <strong className="font-sans">{errorMsg}</strong>
        </div>
      )}

      {/* QUERY AND FILTERS SYSTEM */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name or Registration No..."
              className="w-full bg-slate-50 hover:bg-slate-50/85 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-xl pl-10 pr-3 py-2.5 text-xs outline-none transition-all placeholder:text-[11px] text-slate-700"
            />
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Grade:</span>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-600 outline-none hover:bg-slate-50/85 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="">All Primary Grades</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Section filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block pl-1">Section:</span>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-600 outline-none hover:bg-slate-50/85 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C'].map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ROSTER TABLE AND ACCORDION DISPLAY */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">System Records Output</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Showing {studentsData.length} records of {totalItems} matches.</p>
          </div>
          <span className="bg-slate-100 text-slate-600 font-extrabold text-[10px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wide select-none">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">Syncing Ledger...</span>
          </div>
        ) : studentsData.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <BadgeInfo className="w-8 h-8 text-slate-300" />
            <strong className="text-slate-500 text-xs">No Bethelhem Academy students match your search criteria.</strong>
            <p className="text-[10px]">Verify your filters or select enrollment button to register fresh records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400 select-none">
                  <th className="p-4 pl-6">ID & Key</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Assigned Section</th>
                  <th className="p-4">Parent Anchor</th>
                  <th className="p-4">Birth Date</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4 text-center">Admission Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {studentsData.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/30 transition-colors group">
                    {/* ID REGISTRATION */}
                    <td className="p-4 pl-6">
                      <span 
                        onClick={() => handleViewProfile(student.userId)}
                        className="font-mono font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer underline hover:no-underline select-all bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                      >
                        {student.registrationNo}
                      </span>
                    </td>
                    
                    {/* FULL NAME */}
                    <td className="p-4">
                      <div>
                        <strong 
                          onClick={() => handleViewProfile(student.userId)}
                          className="font-bold text-slate-800 text-[13px] hover:text-indigo-600 cursor-pointer hover:underline transition-colors block"
                        >
                          {student.fullName}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{student.email || 'No email registered'}</span>
                      </div>
                    </td>

                    {/* ASSIGNED SECTION */}
                    <td className="p-4">
                      {student.className && student.className !== 'Unassigned' ? (
                        <div className="inline-flex flex-col">
                          <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold text-[10px] px-3 py-1 rounded-xl uppercase tracking-wider block text-center">
                            {student.className}
                          </span>
                        </div>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 font-extrabold text-[10px] px-3 py-1 rounded-xl uppercase block text-center">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* PARENT ANCHOR */}
                    <td className="p-4">
                      <div>
                        <strong className="text-slate-700 font-bold block">{student.parentName || 'N/A'}</strong>
                        {student.parentPhone && student.parentPhone !== 'N/A' && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1 font-mono">
                            <Phone className="w-2.5 h-2.5" />
                            {student.parentPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* DOB */}
                    <td className="p-4 font-mono font-medium text-slate-500">{student.dob}</td>

                    {/* GENDER */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${student.gender === 'Female' ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-blue-50 text-blue-700'}`}>
                        {student.gender}
                      </span>
                    </td>

                    {/* ADMISSION DATE */}
                    <td className="p-4 font-mono text-center text-slate-500">
                      {student.enrollmentDate || '2026-09-01'}
                    </td>

                    {/* ACTIONS BUTTONS */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewProfile(student.userId)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
                          title="View transcript & diagnostics"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Profile
                        </button>

                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-150 cursor-pointer"
                          title="Modify student settings"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() => handleDeleteClick(student.userId, student.fullName)}
                          className="p-2 bg-rose-50 text-rose-650 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                          title="Expel / Remove student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/10 flex items-center justify-between gap-4 select-none">
            <span className="text-[11px] font-semibold text-slate-400">Total matched: <strong className="text-slate-600">{totalItems} results</strong></span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 bg-slate-150 hover:bg-slate-200/80 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 font-bold font-mono text-[11px] rounded-xl transition-colors cursor-pointer ${currentPage === i + 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 bg-slate-150 hover:bg-slate-200/80 rounded-xl text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT DIALOG OVERLAY */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-2xl shadow-2xl relative overflow-hidden my-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {editStudentId ? 'Revise Student Credentials' : 'Enroll Student Roster'}
                </h3>
                <p className="text-[10px] text-emerald-100">Setup academy pupil parameters and automatically wire guardian associations.</p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-xs">
              {/* PRIMARY PUPIL INFO */}
              <div className="space-y-3">
                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-1">1. Student Details</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">First Name *</label>
                    <input
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="e.g. Samuel"
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                    />
                  </div>

                  {/* Last name */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Last Name *</label>
                    <input
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="e.g. Alula"
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Email */}
                  <div className="space-y-1 col-span-2">
                    <label className="font-bold text-slate-600 block">Student System Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. samuel.alula@bya.edu"
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Date of Birth *</label>
                    <input
                      name="dob"
                      type="date"
                      required
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                    />
                  </div>

                  {/* Grade choice */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Academic Grade Assignment *</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-all cursor-pointer font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                        <option key={g} value={g.toString()}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section choice */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Homeroom Section *</label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-emerald-600 transition-all cursor-pointer font-medium"
                    >
                      {['A', 'B', 'C'].map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Admission Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Admission Date / Enrollment Date</label>
                    <input
                      name="admissionDate"
                      type="date"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* PARENT LINKING DECK */}
              <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-100/50 rounded-2xl">
                <span className="font-extrabold text-[10px] text-slate-400 block uppercase tracking-widest pb-1 border-b border-slate-100">2. Parent & Guardian Synchronization</span>
                
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 pr-5">
                    <input
                      type="radio"
                      name="parentMode"
                      value="existing"
                      checked={formData.parentMode === 'existing'}
                      onChange={handleInputChange}
                      className="text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                    Link Existing Parent Roster
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-600">
                    <input
                      type="radio"
                      name="parentMode"
                      value="new"
                      checked={formData.parentMode === 'new'}
                      onChange={handleInputChange}
                      className="text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                    Generate New Guardian Profile
                  </label>
                </div>

                {formData.parentMode === 'existing' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Select Parent Link Anchor *</label>
                    <select
                      name="parentId"
                      value={formData.parentId}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-150 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-600 transition-all cursor-pointer font-medium text-slate-700"
                    >
                      <option value="">No Anchor Linked</option>
                      {parents.map(p => (
                        <option key={p.id} value={p.userId}>
                          {p.fullName} ({p.occupation}) - {p.phone || 'no phone'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Parent Full name */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Parent / Guardian Name *</label>
                        <input
                          name="parentName"
                          required={formData.parentMode === 'new'}
                          value={formData.parentName}
                          onChange={handleInputChange}
                          placeholder="e.g. Genet Demissie"
                          className="w-full bg-white border border-slate-150 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                        />
                      </div>
                      
                      {/* Parent phone */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Guardian Phone *</label>
                        <input
                          name="parentPhone"
                          required={formData.parentMode === 'new'}
                          value={formData.parentPhone}
                          onChange={handleInputChange}
                          placeholder="e.g. +251 912 345 678"
                          className="w-full bg-white border border-slate-150 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px] font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Occupation */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Guardian Occupation</label>
                        <input
                          name="parentOccupation"
                          value={formData.parentOccupation}
                          onChange={handleInputChange}
                          placeholder="e.g. Architect"
                          className="w-full bg-white border border-slate-150 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                        />
                      </div>

                      {/* Parent address */}
                      <div className="space-y-1 col-span-2">
                        <label className="font-bold text-slate-500 block">Guardian Physical Address *</label>
                        <input
                          name="parentAddress"
                          required={formData.parentMode === 'new'}
                          value={formData.parentAddress}
                          onChange={handleInputChange}
                          placeholder="e.g. Bole Subcity, House No 12, Addis Ababa"
                          className="w-full bg-white border border-slate-150 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION COMMAND BAR */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold uppercase px-6 py-3 rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wide px-7 py-3 rounded-2xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving Ledger...' : editStudentId ? 'Commit Revisions' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE DETAILED PORTFOLIO OVERLAY */}
      {profileStudentId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-3xl shadow-2xl relative overflow-hidden my-8">
            {/* Header info */}
            <div className="bg-slate-800 p-6 text-white relative">
              <button
                onClick={() => setProfileStudentId(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {profileLoading ? (
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                    <div className="h-3 w-48 bg-white/10 rounded"></div>
                  </div>
                </div>
              ) : profileData ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-inner select-none uppercase font-sans">
                      {profileData.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base tracking-tight">{profileData.fullName}</h3>
                        <span className="bg-emerald-500/20 text-emerald-450 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
                          {profileData.registrationNo}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                        <span>Homeroom: <strong className="text-white hover:underline">{profileData.className || 'Unassigned'}</strong></span>
                        <span>·</span>
                        <span>Gender: <strong className="text-white">{profileData.gender}</strong></span>
                        <span>·</span>
                        <span className="font-mono">DOB: {profileData.dob}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 bg-slate-900/30 px-3 py-2 rounded-xl border border-slate-700/30">
                    ADMITTED ON: {profileData.enrollmentDate || '2026-09-01'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Failed to stream metadata.</div>
              )}
            </div>

            {/* TAB SYSTEM */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
              {[
                { id: 'grades', label: 'Academic Grades', icon: BookOpen },
                { id: 'attendance', label: 'Attendance Audit', icon: Clock },
                { id: 'conduct', label: 'Behavior Records', icon: ShieldAlert },
                { id: 'parent', label: 'Guardian Anchor', icon: User }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setProfileActiveTab(tab.id as any)}
                    className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer select-none ${profileActiveTab === tab.id ? 'border-emerald-600 text-emerald-605 bg-white' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB BODY CONTROLS */}
            <div className="p-6 max-h-[380px] overflow-y-auto text-xs">
              {profileLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-450"></div>
                  <p className="text-xs text-slate-400 font-bold tracking-wider animate-pulse uppercase">Retrieving transcript records...</p>
                </div>
              ) : profileData ? (
                <div>
                  {/* TAB: GRADES */}
                  {profileActiveTab === 'grades' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Academic Mark History</span>
                        {profileData.grades?.length > 0 && (
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[11px] font-bold text-slate-600 flex items-center gap-2">
                            <span>GPA / Mark Average:</span>
                            <strong className="text-indigo-600 px-1 rounded">
                              {Math.round(profileData.grades.reduce((acc: number, item: any) => acc + item.marksObtained, 0) / profileData.grades.length)}%
                            </strong>
                          </div>
                        )}
                      </div>

                      {(!profileData.grades || profileData.grades.length === 0) ? (
                        <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                          <BookOpen className="w-6 h-6 text-slate-350" />
                          No class test coordinates registered for this child this term.
                        </div>
                      ) : (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                <th className="p-3 pl-4">Subject Name & Code</th>
                                <th className="p-3 text-center">Score</th>
                                <th className="p-3 text-center">Grade Status</th>
                                <th className="p-3">Period</th>
                                <th className="p-3">Educator Comments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-650">
                              {profileData.grades.map((grade: any) => (
                                <tr key={grade.id} className="hover:bg-slate-50/20">
                                  <td className="p-3 pl-4">
                                    <strong className="text-slate-800">{grade.subjectName}</strong>
                                    <span className="text-[10px] text-slate-400 block font-mono uppercase mt-0.5">{grade.subjectCode || 'ACAD'}</span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-700">
                                    {grade.marksObtained} / {grade.maxMarks || 100}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full">
                                      {grade.grade}
                                    </span>
                                  </td>
                                  <td className="p-3 font-medium text-slate-500">{grade.term || 'Term 1'}</td>
                                  <td className="p-3 text-slate-500 italic max-w-xs">{grade.remarks || 'No remarks recorded.'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: ATTENDANCE */}
                  {profileActiveTab === 'attendance' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Presence Security Rolls</span>
                        {profileData.attendance?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider pl-1">Daily Rate:</span>
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono">
                              {Math.round((profileData.attendance.filter((a: any) => a.status === 'Present').length / profileData.attendance.length) * 100 || 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {(!profileData.attendance || profileData.attendance.length === 0) ? (
                        <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                          <CheckCircle className="w-6 h-6 text-slate-350" />
                          No roll call event coordinates registered for this child yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {profileData.attendance.map((att: any) => (
                            <div key={att.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-100 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <strong className="text-slate-800 font-mono text-[12px]">{att.date}</strong>
                                  <p className="text-[10px] text-slate-400 mt-0.5 italic">{att.remarks || 'Morning and Afternoon normal entry.'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-extrabold text-[10px] uppercase px-3 py-1 rounded-full ${
                                  att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 
                                  att.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-150' : 
                                  'bg-rose-50 text-rose-750 border border-rose-150'
                                }`}>
                                  {att.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: CONDUCT */}
                  {profileActiveTab === 'conduct' && (
                    <div className="space-y-4">
                      <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block">Class Conduct and Demerits</span>

                      {(!profileData.conduct || profileData.conduct.length === 0) ? (
                        <div className="p-8 bg-slate-50 rounded-2xl text-center text-emerald-600 flex flex-col items-center justify-center gap-2 border border-dashed border-emerald-150">
                          <CheckCircle className="w-7 h-7 text-emerald-605" />
                          <strong className="text-xs">Exemplary Conduct Standing</strong>
                          <p className="text-[10px] text-slate-400 font-sans">No negative behavior warnings or disciplinary incidents found in records.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {profileData.conduct.map((cnd: any) => (
                            <div key={cnd.id} className="p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    cnd.conductScore === 'Excellent' || cnd.conductScore === 'Good' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-55 text-rose-700'
                                  }`}>
                                    {cnd.conductScore}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">{cnd.incidentDate}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">Reported by: <strong className="text-slate-600">{cnd.reportedBy}</strong></span>
                              </div>
                              <p className="text-xs text-slate-650 leading-relaxed font-medium">{cnd.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: GUARDIAN ANCHOR DETAILS */}
                  {profileActiveTab === 'parent' && (
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
                      <div className="flex items-center gap-3.5 border-b border-slate-200/50 pb-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <strong className="text-slate-850 text-sm block font-sans">{profileData.parentName || 'No Guardian Linked'}</strong>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Primary emergency notification receiver.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="text-xs text-slate-600 font-medium">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Phone Number</span>
                            <span className="font-mono">{profileData.parentPhone || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                          <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="text-xs text-slate-600 font-medium">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Occupation</span>
                            <span>{profileData.parentOccupation || 'Self-Employed'}</span>
                          </div>
                        </div>

                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 col-span-2">
                          <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                          <div className="text-xs text-slate-600 font-medium">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Home Address</span>
                            <span>{profileData.parentAddress || 'Addis Ababa, Ethiopia'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-6">Coordinates not online.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setProfileStudentId(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold uppercase px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
