import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'teacher' | 'student' | 'parent')[];
  fallbackSection?: string;
  setActiveSection?: (sec: string) => void;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackSection = 'overview', 
  setActiveSection 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-mono uppercase tracking-widest text-slate-400">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></span>
        Evaluating authorization rules...
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center space-y-4 max-w-sm mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <LogIn className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-sm">Security Clearance Required</h3>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            Please log in with valid credentials to query this school registry.
          </p>
        </div>
      </div>
    );
  }

  // Role restricted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-slate-100 p-12 rounded-3xl text-center space-y-6 max-w-md mx-auto shadow-xl shadow-slate-100/50">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-800 text-base">Authorization Access Restricted</h3>
          <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">
            Required: [{allowedRoles.join(' / ')}]
          </p>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Your current account role (<strong>{user.role}</strong>) does not hold the clearance parameters required to view these details. Active audits are logged under {user.email}.
          </p>
        </div>

        {setActiveSection && (
          <button
            onClick={() => setActiveSection(fallbackSection)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-2 mx-auto cursor-pointer"
          >
            Return to {fallbackSection}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
