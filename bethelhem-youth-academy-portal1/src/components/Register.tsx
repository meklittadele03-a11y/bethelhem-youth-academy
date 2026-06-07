import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  School, 
  Lock, 
  Mail, 
  User, 
  Phone,
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface RegisterProps {
  onToggleToLogin: () => void;
}

export default function Register({ onToggleToLogin }: RegisterProps) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>('student');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !email || !password || !role) {
      setErrorMsg('Please compile all required fields (marked *).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Security key password must contain at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        fullName,
        email,
        passwordPlain: password,
        role,
        phone
      });
      
      setSuccessMsg('Account registered successfully inside the database registry!');
      // Reset form variables
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      
      // Auto transition to login after 2 seconds
      setTimeout(() => {
        onToggleToLogin();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred signing up. Contact IT registrar.');
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

      {/* Main Registration Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Portal Registration</h2>
          <button 
            onClick={onToggleToLogin}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline tracking-tight transition-colors"
          >
            Back to Login
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 text-xs flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Martha Hailu"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Registered Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. martha@bya.edu"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Create Password (min 6 chars) *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Compose a secure password"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +251 911 000 000"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-emerald-600 transition-all placeholder:text-slate-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          {/* Role selector buttons */}
          <div className="space-y-2">
            <label className="font-bold text-slate-600 block">Select Registration Role *</label>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {(['student', 'parent', 'teacher', 'admin'] as const).map((r) => (
                <button
                  id={`reg-role-btn-${r}`}
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`border py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider text-center transition-all ${
                    role === r 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt terms */}
          <div className="flex items-start gap-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Upon successful registration, standard security hashes will lock your identity profiles securely. A unique <strong>School Code ID</strong> card will be auto-generated positing your privileges.
            </p>
          </div>

          <button
            id="reg-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold tracking-widest uppercase py-3.5 rounded-xl cursor-pointer shadow transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Creating profile...' : 'Register Profile & Initiate'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
