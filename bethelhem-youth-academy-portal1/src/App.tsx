import React, { useState } from 'react';
import { School } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import InfoHub from './components/InfoHub';

import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

function PortalContent() {
  const { user, loading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showRegister, setShowRegister] = useState(false);

  // Show loading spinner while system state loads
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-xs text-center">
        <School className="w-12 h-12 text-emerald-600 animate-pulse mb-4" />
        <span className="font-extrabold text-slate-500 font-mono uppercase tracking-widest">
          Loading Bethelhem Academy Portal...
        </span>
      </div>
    );
  }

  // Not logged in: show login/register
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col justify-between py-12 px-4 selection:bg-emerald-500 selection:text-white">
        {showRegister ? (
          <Register onToggleToLogin={() => setShowRegister(false)} />
        ) : (
          <Login onToggleToRegister={() => setShowRegister(true)} />
        )}

        <div className="text-center text-[10px] text-slate-400 font-mono mt-12">
          Bethelhem Youth Academy · Web Dashboard · Addis Ababa, Ethiopia
        </div>
      </div>
    );
  }

  // Logged in: render appropriate role dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar 
        currentUser={user} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        onLogout={logout} 
      />

      <main className="flex-1 overflow-y-auto p-12 h-screen">
        {activeSection === 'architecture' ? (
          <InfoHub />
        ) : (
          <>
            {user.role === 'admin' && (
              <ProtectedRoute allowedRoles={['admin']} fallbackSection="overview" setActiveSection={setActiveSection}>
                <AdminDashboard activeSection={activeSection} />
              </ProtectedRoute>
            )}

            {user.role === 'teacher' && (
              <ProtectedRoute allowedRoles={['teacher', 'admin']} fallbackSection="overview" setActiveSection={setActiveSection}>
                <TeacherDashboard activeSection={activeSection} />
              </ProtectedRoute>
            )}

            {user.role === 'student' && (
              <ProtectedRoute allowedRoles={['student']} fallbackSection="overview" setActiveSection={setActiveSection}>
                <StudentDashboard currentUser={user} activeSection={activeSection} />
              </ProtectedRoute>
            )}

            {user.role === 'parent' && (
              <ProtectedRoute allowedRoles={['parent']} fallbackSection="overview" setActiveSection={setActiveSection}>
                <ParentDashboard currentUser={user} activeSection={activeSection} />
              </ProtectedRoute>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}
