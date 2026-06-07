import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bya_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept expired tokens or errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local credentials on unauthenticated responses
      localStorage.removeItem('bya_token');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('bya_token', res.data.token);
    }
    return res.data;
  },
  register: async (userData: {
    fullName: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    phone?: string;
  }) => {
    const res = await api.post('/auth/register', {
      fullName: userData.fullName,
      email: userData.email,
      password: userData.passwordPlain,
      role: userData.role,
      phone: userData.phone
    });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
  logout: () => {
    localStorage.removeItem('bya_token');
  },
};

export const schoolService = {
  getStats: async () => {
    const res = await api.get('/stats');
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/students');
    return res.data;
  },
  getStudentsWithFilters: async (params?: { search?: string; grade?: string; section?: string; page?: number; limit?: number }) => {
    const res = await api.get('/students', { params });
    return res.data;
  },
  getStudentProfile: async (id: string) => {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },
  registerStudent: async (studentData: any) => {
    const res = await api.post('/students', studentData);
    return res.data;
  },
  updateStudent: async (id: string, studentData: any) => {
    const res = await api.put(`/students/${id}`, studentData);
    return res.data;
  },
  deleteStudent: async (id: string) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
  getTeachers: async () => {
    const res = await api.get('/teachers');
    return res.data;
  },
  registerTeacher: async (teacherData: any) => {
    const res = await api.post('/teachers', teacherData);
    return res.data;
  },
  updateTeacher: async (id: string, teacherData: any) => {
    const res = await api.put(`/teachers/${id}`, teacherData);
    return res.data;
  },
  deleteTeacher: async (id: string) => {
    const res = await api.delete(`/teachers/${id}`);
    return res.data;
  },
  getParents: async () => {
    const res = await api.get('/parents');
    return res.data;
  },
  getClasses: async () => {
    const res = await api.get('/classes');
    return res.data;
  },
  getSubjects: async () => {
    const res = await api.get('/subjects');
    return res.data;
  },
  getAttendance: async (classId: string, date: string, session?: 'morning' | 'afternoon') => {
    const url = session 
      ? `/attendance?classId=${classId}&date=${date}&session=${session}`
      : `/attendance?classId=${classId}&date=${date}`;
    const res = await api.get(url);
    return res.data;
  },
  getAllAttendanceLogs: async () => {
    const res = await api.get('/attendance');
    return res.data;
  },
  submitAttendance: async (logData: {
    studentId: string;
    studentName: string;
    classId: string;
    date: string;
    session?: 'morning' | 'afternoon';
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    remarks?: string;
  }) => {
    const res = await api.post('/attendance', logData);
    return res.data;
  },
  getAssessments: async (studentId?: string, subjectId?: string) => {
    let url = '/assessments';
    const params = [];
    if (studentId) params.push(`studentId=${studentId}`);
    if (subjectId) params.push(`subjectId=${subjectId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await api.get(url);
    return res.data;
  },
  submitAssessment: async (markData: {
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    marksObtained: number;
    maxMarks?: number;
    grade: string;
    term?: string;
    quarter?: string;
    classId?: string;
    status?: string;
    remarks?: string;
  }) => {
    const res = await api.post('/assessments', markData);
    return res.data;
  },
  getConduct: async () => {
    const res = await api.get('/conduct');
    return res.data;
  },
  submitConduct: async (conductData: any) => {
    const res = await api.post('/conduct', conductData);
    return res.data;
  },
  updateConduct: async (id: string, conductData: any) => {
    const res = await api.put(`/conduct/${id}`, conductData);
    return res.data;
  },
  deleteConduct: async (id: string) => {
    const res = await api.delete(`/conduct/${id}`);
    return res.data;
  },
  getAnnouncements: async () => {
    const res = await api.get('/announcements');
    return res.data;
  },
  submitAnnouncement: async (annData: any) => {
    const res = await api.post('/announcements', annData);
    return res.data;
  },
  updateAnnouncement: async (id: string, annData: any) => {
    const res = await api.put(`/announcements/${id}`, annData);
    return res.data;
  },
  deleteAnnouncement: async (id: string) => {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },
  getTimetables: async () => {
    const res = await api.get('/timetables');
    return res.data;
  },
  submitTimetable: async (timetableData: any) => {
    const res = await api.post('/timetables', timetableData);
    return res.data;
  },
  updateTimetable: async (id: string, timetableData: any) => {
    const res = await api.put(`/timetables/${id}`, timetableData);
    return res.data;
  },
  deleteTimetable: async (id: string) => {
    const res = await api.delete(`/timetables/${id}`);
    return res.data;
  },
  getGradeApprovals: async () => {
    const res = await api.get('/grade-approvals');
    return res.data;
  },
  submitGradeApproval: async (approvalData: any) => {
    const res = await api.post('/grade-approvals', approvalData);
    return res.data;
  },
  updateGradeApprovalStatus: async (id: string, status: 'Approved' | 'Rejected') => {
    const res = await api.patch(`/grade-approvals/${id}`, { status });
    return res.data;
  },
  getReportCard: async (studentId?: string, quarter?: string) => {
    const res = await api.get('/report-card', { params: { studentId, quarter } });
    return res.data;
  },
  updateAssessment: async (id: string, gradeData: any) => {
    const res = await api.patch(`/assessments/${id}`, gradeData);
    return res.data;
  },
  deleteAssessment: async (id: string) => {
    const res = await api.delete(`/assessments/${id}`);
    return res.data;
  }
};

export default api;
