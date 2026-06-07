import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  School, 
  Lock, 
  Mail, 
  AlertCircle, 
  Sparkles, 
  User,
  ArrowRight
} from 'lucide-react';

interface LoginProps {
  onToggleToRegister: () => void;
}

export default function Login({ onToggleToRegister }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginAsDemo = async (demoEmail: string, demoPass: string) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      setEmail(demoEmail);
      setPassword(demoPass);
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sandbox authentication failure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-8 my-auto p-4 sm:p-0">
      {/* Academy Logo Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/20 mx-auto">
          <School className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight font-sans">Bethelhem Youth Academy</h1>
          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mt-1">Smart School Management Portal</p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Security Login Gate</h2>
          <button 
            onClick={onToggleToRegister}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline tracking-tight transition-colors"
          >
            Create an Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 text-xs flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Registered Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@bya.edu"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Account Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security key"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold tracking-widest uppercase py-3.5 rounded-xl cursor-pointer shadow transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? 'Verifying session...' : 'Acknowledge & Access Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Sandbox Quick Impersonator controls to assist demo and manual runs */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-[10px] tracking-widest uppercase text-slate-400 font-mono">Sandbox Demo Logins</h3>
        </div>
        
        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
          Select an account to instantly explore respective role-based access configurations and dynamic restrictions:
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            { role: 'Admin (Abebe)', e: 'admin@bya.edu', p: 'admin123', color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10' },
            { role: 'Teacher (Almaz)', e: 'teacher@bya.edu', p: 'teacher123', color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10' },
            { role: 'Student (Yonas)', e: 'student@bya.edu', p: 'student123', color: 'hover:border-amber-500/50 hover:bg-amber-500/10' },
            { role: 'Parent (Mekonnen)', e: 'parent@bya.edu', p: 'parent123', color: 'hover:border-sky-500/50 hover:bg-sky-500/10' }
          ].map((acc, index) => (
            <button
              id={`demo-btn-${index}`}
              key={index}
              onClick={() => loginAsDemo(acc.e, acc.p)}
              className={`border border-slate-800 p-2.5 rounded-xl text-left bg-slate-950/40 text-slate-200 transition-all cursor-pointer font-bold ${acc.color}`}
            >
              <span className="block text-slate-300 font-bold">{acc.role}</span>
              <span className="block text-[8px] text-slate-400 font-mono mt-0.5">{acc.e}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
