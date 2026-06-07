import React, { useState } from 'react';
import { Settings, Shield, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function SettingsTab() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Administrative school settings defaults
  const [settings, setSettings] = useState({
    schoolName: 'Bethelhem Youth Academy',
    academicYear: '2026/2027 E.C. (2019 Gregorian)',
    passMark: '50%',
    conductApprovalRequired: 'Mandatory',
    gradeApprovalRequired: 'Mandatory',
    gradingPeriod: 'Termly Q1-Q4'
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess('');
    setError('');

    setTimeout(() => {
      setUpdating(false);
      setSuccess('School general configuration updated.');
    }, 800);
  };

  const handleForceSeed = () => {
    if (!window.confirm('Are you sure you want to restore default mock databases? This will refresh all student registers and remove any newly generated conduct or scheduling items.')) return;
    setUpdating(true);
    setSuccess('');

    // Reload browser to trigger server reset optionally or update
    setTimeout(() => {
      setUpdating(false);
      setSuccess('Mock school database initialized and reset successfully.');
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h3 className="text-base font-bold text-slate-800">System Preferences</h3>
        <p className="text-xs text-slate-500 mt-0.5">Control administrative presets, grading indices, and core database states.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-805 border border-emerald-100 rounded-xl flex items-center gap-3">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Settings Form */}
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="border-b border-slate-50 pb-2 mb-2 flex items-center gap-2 font-bold text-slate-700">
            <Settings className="w-4 h-4 text-emerald-600" />
            General School Profile Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">School Custom Title *</label>
              <input
                name="schoolName"
                value={settings.schoolName}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Current Academic School Year</label>
              <input
                name="academicYear"
                value={settings.academicYear}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Minimum Pass Threshold *</label>
              <select
                name="passMark"
                value={settings.passMark}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition-colors"
              >
                <option value="50%">50% (Academy Default Standard)</option>
                <option value="60%">60% (High Honors Standard)</option>
                <option value="70%">70% (Premium Standard)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Grade Audits Workflow *</label>
              <select
                name="gradeApprovalRequired"
                value={settings.gradeApprovalRequired}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition-colors"
              >
                <option value="Mandatory">Mandatory Admin Signoff</option>
                <option value="Optional">Optional (Direct Publication)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Active Grading Periodicity</label>
              <input
                name="gradingPeriod"
                value={settings.gradingPeriod}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition-colors"
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-all sm:w-auto w-full text-center"
            >
              {updating ? 'Saving Changes...' : 'Save System Prefs'}
            </button>
          </div>
        </form>

        {/* Right Side Database Management Tools */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-50 pb-2 mb-2 flex items-center gap-2 font-bold text-slate-700">
              <Shield className="w-4 h-4 text-emerald-650" />
              Database Operations Deck
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px]">
              Perform database seeding audits, clean system cache logs, or reload mock structures instantly for presentation.
            </p>
          </div>

          <button
            onClick={handleForceSeed}
            disabled={updating}
            className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wider uppercase px-4 py-3 rounded-2xl cursor-pointer shadow transition-all hover:scale-[1.01]"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            Seed / Reinitialize Mock Database
          </button>
        </div>
      </div>
    </div>
  );
}
