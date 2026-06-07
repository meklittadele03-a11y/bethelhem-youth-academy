import React from 'react';
import { 
  Users, 
  Clock, 
  GraduationCap, 
  Database, 
  LogOut, 
  LayoutDashboard, 
  FileText,
  User,
  School,
  Shield,
  Calendar,
  Megaphone,
  Settings as SettingsIcon,
  BarChart3
} from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  currentUser: UserType | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentUser, activeSection, setActiveSection, onLogout }: SidebarProps) {
  if (!currentUser) return null;

  const roleNameDisplay = {
    admin: 'School Administrator',
    teacher: 'Academic Instructor',
    student: 'Student Portal',
    parent: 'Parent Portal',
  }[currentUser.role] || 'User Portal';

  // Define navigation sections depending on the role
  const getNavItems = () => {
    if (currentUser.role === 'admin') {
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'teachers', label: 'Teachers', icon: GraduationCap },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'grades', label: 'Grades', icon: GraduationCap },
        { id: 'conduct', label: 'Conduct', icon: Shield },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'architecture', label: 'Specs & Blueprint', icon: Database }
      ];
    }

    const items = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ];

    if (currentUser.role === 'teacher') {
      items.push({ id: 'students', label: 'Students Roster', icon: Users });
      items.push({ id: 'conduct', label: 'Conduct & Discipline', icon: Shield });
    }

    items.push({ id: 'attendance', label: 'Attendance Tracker', icon: Clock });
    items.push({ id: 'grades', label: 'Academics & Grades', icon: GraduationCap });
    items.push({ id: 'timetable', label: 'Weekly Schedule', icon: Calendar });
    items.push({ id: 'announcements', label: 'Announcements', icon: Megaphone });
    items.push({ id: 'architecture', label: 'Specs & Blueprint', icon: Database });

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="w-80 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 h-screen overflow-y-auto">
      {/* Title / Banner Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <School className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-slate-100 tracking-wide uppercase">Bethelhem</h1>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Youth Academy</p>
        </div>
      </div>

      {/* User Information Panel */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-300" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-xs text-slate-100 truncate">{currentUser.fullName}</h4>
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 uppercase mt-1">
              {roleNameDisplay}
            </span>
          </div>
        </div>
        <div className="mt-3 text-[10px] text-slate-400 leading-none truncate font-mono">
          Reg: {currentUser.registrationNo}
        </div>
      </div>

      {/* Navigation Controls */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs tracking-wide cursor-pointer ${
                active 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout Action Button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all text-xs font-bold font-mono uppercase tracking-widest cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Portal
        </button>
      </div>
    </div>
  );
}
