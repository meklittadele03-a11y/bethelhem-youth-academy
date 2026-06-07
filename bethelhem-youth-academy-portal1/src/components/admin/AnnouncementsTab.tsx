import React, { useState, useEffect } from 'react';
import { schoolService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Megaphone,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  Send,
  Bell,
  Eye,
  Filter,
  Search,
  Check,
  X,
  Volume2,
  FilePenLine,
  ListFilter,
  EyeOff
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: 'announcement' | 'system' | 'editorial';
}

export default function AnnouncementsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const canPublish = isAdmin || isTeacher;

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // UI Display Control States
  const [showForm, setShowForm] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'All' | 'Teachers' | 'Parents' | 'Students' | 'Any'>('Any');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');

  // Form states for Create
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetAudience: 'All' as 'All' | 'Teachers' | 'Parents' | 'Students',
    status: 'Published' as 'Published' | 'Draft'
  });

  // Form states for Edit
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    targetAudience: 'All' as 'All' | 'Teachers' | 'Parents' | 'Students',
    status: 'Published' as 'Published' | 'Draft'
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const list = await schoolService.getAnnouncements();
      // Ensure all announcements have a status (default to Published for older ones)
      const sanitized = list.map((a: any) => ({
        ...a,
        status: a.status || 'Published'
      }));
      setAnnouncements(sanitized);

      // Dynamically generate standard system notification objects for any unread announcements
      updateNotificationsFromAnnouncements(sanitized);
    } catch (err) {
      console.error('Failed to load school bulletins.', err);
    } finally {
      setLoading(false);
    }
  };

  // Build notifications feed from loaded data
  const updateNotificationsFromAnnouncements = (annList: any[]) => {
    const savedReadIds = JSON.parse(localStorage.getItem(`read_ann_ids_${user?.id}`) || '[]');
    
    // Filter announcements targeting this user's role
    const targetingUser = annList.filter(ann => {
      // Drafts should only be in notifications for admins/teachers
      if (ann.status === 'Draft' && !canPublish) return false;
      
      if (user?.role === 'student') return ann.targetAudience === 'All' || ann.targetAudience === 'Students';
      if (user?.role === 'parent') return ann.targetAudience === 'All' || ann.targetAudience === 'Parents';
      return true; // Admin and Teacher
    });

    const newNotifications: NotificationItem[] = targetingUser.map(ann => ({
      id: ann.id,
      title: `Notice: ${ann.title}`,
      message: ann.content.substring(0, 120) + (ann.content.length > 120 ? '...' : ''),
      createdAt: ann.createdAt || new Date().toISOString().split('T')[0],
      isRead: savedReadIds.includes(ann.id),
      type: 'announcement'
    }));

    // Sort to show unread notifications first, then by date desc
    newNotifications.sort((a, b) => {
      if (a.isRead === b.isRead) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.isRead ? 1 : -1;
    });

    setNotifications(newNotifications);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [user]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Mark all as read
  const markAllNotificationsAsRead = () => {
    const savedReadIds = Array.from(new Set([
      ...JSON.parse(localStorage.getItem(`read_ann_ids_${user?.id}`) || '[]'),
      ...notifications.map(n => n.id)
    ]));
    localStorage.setItem(`read_ann_ids_${user?.id}`, JSON.stringify(savedReadIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    triggerToast('All notices marked as read.');
  };

  // Toggle single notification status
  const toggleNotificationRead = (id: string, currentStatus: boolean) => {
    let savedReadIds = JSON.parse(localStorage.getItem(`read_ann_ids_${user?.id}`) || '[]');
    if (!currentStatus) {
      // Mark as read
      savedReadIds.push(id);
    } else {
      // Mark as unread
      savedReadIds = savedReadIds.filter((item: string) => item !== id);
    }
    localStorage.setItem(`read_ann_ids_${user?.id}`, JSON.stringify(savedReadIds));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !currentStatus } : n));
  };

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  // Publish Announcement
  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!form.title.trim() || !form.content.trim()) {
      setError('Please provide notice title and body content.');
      return;
    }

    try {
      const payload = {
        title: form.title,
        content: form.content,
        targetAudience: form.targetAudience,
        status: form.status
      };

      await schoolService.submitAnnouncement(payload);

      setSuccess(`Announcement draft successfully ${form.status === 'Published' ? 'broadcasted and published' : 'saved to Drafts'}.`);
      triggerToast(`New announcement created as ${form.status}!`);
      
      setForm({
        title: '',
        content: '',
        targetAudience: 'All',
        status: 'Published'
      });
      setShowForm(false);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not conclude bulletin declaration.');
    }
  };

  // Toggle Publish Status Directly
  const togglePublicationState = async (ann: any) => {
    try {
      const nextStatus = ann.status === 'Published' ? 'Draft' : 'Published';
      await schoolService.updateAnnouncement(ann.id, {
        status: nextStatus
      });
      triggerToast(`Announcement moved to ${nextStatus}.`);
      loadAnnouncements();
    } catch (err) {
      setError('Failed to adjust notice publication state.');
    }
  };

  // Start Edit Mode
  const startEdit = (ann: any) => {
    setEditingAnn(ann);
    setEditForm({
      title: ann.title,
      content: ann.content,
      targetAudience: ann.targetAudience,
      status: ann.status || 'Published'
    });
    setSuccess('');
    setError('');
  };

  // Submit Edit Form
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError('Please fill out notice title and descriptive body context.');
      return;
    }

    try {
      await schoolService.updateAnnouncement(editingAnn.id, {
        title: editForm.title,
        content: editForm.content,
        targetAudience: editForm.targetAudience,
        status: editForm.status
      });

      setSuccess('Bullet announcement alterations verified and stored.');
      triggerToast('Announcement updated!');
      setEditingAnn(null);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update bulletin contents.');
    }
  };

  // Remove Announcement
  const removeAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this school notice? This setup clears it for all targets.')) return;
    try {
      setSuccess('');
      setError('');
      await schoolService.deleteAnnouncement(id);
      setSuccess('School notice cleared from dynamic rosters.');
      triggerToast('Notice deleted.');
      loadAnnouncements();
    } catch (err) {
      setError('Could not remove publication record.');
    }
  };

  // Colors mapping for target audience
  const getTargetBadgeColor = (aud: string) => {
    switch (aud) {
      case 'All': return 'bg-slate-50 border border-slate-200 text-slate-600';
      case 'Teachers': return 'bg-indigo-50 border border-indigo-100 text-indigo-700';
      case 'Parents': return 'bg-amber-50 border border-amber-100 text-amber-700';
      default: return 'bg-emerald-50 border border-emerald-100 text-emerald-700';
    }
  };

  // Filtering Announcements to render
  const filteredAnnouncements = announcements.filter(ann => {
    // 1. If it's draft, only teachers and admins can view
    if (ann.status === 'Draft' && !canPublish) {
      return false;
    }

    // 2. Audience filters
    if (user?.role === 'student' && ann.targetAudience !== 'All' && ann.targetAudience !== 'Students') {
      return false;
    }
    if (user?.role === 'parent' && ann.targetAudience !== 'All' && ann.targetAudience !== 'Parents') {
      return false;
    }

    // 3. User filter selection on audience
    if (audienceFilter !== 'Any' && ann.targetAudience !== audienceFilter) {
      return false;
    }

    // 4. User filter selection on status
    if (statusFilter !== 'All' && ann.status !== statusFilter) {
      return false;
    }

    // 5. Search query matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(q);
      const matchContent = ann.content?.toLowerCase().includes(q);
      const matchAuthor = ann.postedBy?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-400">
        Reviewing official announcements and bulletin feeds...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs relative" id="notices-main-container">
      
      {/* Toast Alert Banner */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-[11px] p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <Bell className="w-4 h-4 text-emerald-400 animate-swing" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Main Header / Title Block */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Academic Bulletins & Information Hub</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronize, review, and draft scholastic circulars, regulatory announcements, or event notices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notification Button Triggers */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Toggle Notifications Center Panel"
          >
            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-rose-500 animate-wiggle' : 'text-slate-500'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold text-[8px] leading-none shrink-0 border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {canPublish && (
            <button
              onClick={() => {
                setEditingAnn(null);
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Megaphone className="w-3.5 h-3.5" />
              {showForm ? 'Hide Creator' : 'Broadcast Bulletin'}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Status Notices */}
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center gap-3 animate-fade-in" id="success-indicator">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl flex items-center gap-3 animate-fade-in" id="error-indicator">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Notifications Drawer Drawer Box */}
      {showNotifications && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <strong className="text-xs uppercase tracking-widest font-bold">Your Notifications Feed</strong>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono text-[9px]">
                {unreadCount} New
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                disabled={unreadCount === 0}
                className="text-[10px] text-emerald-400 font-bold font-mono hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
              >
                Mark All Read
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => toggleNotificationRead(notif.id, notif.isRead)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  notif.isRead
                    ? 'bg-slate-950/20 border-slate-800/60 text-slate-400'
                    : 'bg-slate-850 border-emerald-900/40 text-slate-100 shadow-sm'
                }`}
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-700' : 'bg-emerald-400 animate-ping'}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <h5 className={`font-bold text-[11px] leading-tight ${notif.isRead ? 'text-slate-400 font-medium' : 'text-slate-100'}`}>
                      {notif.title}
                    </h5>
                    <span className="text-[8px] text-slate-500 font-mono tracking-wider shrink-0 ml-2">
                      {notif.createdAt}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="text-center italic py-6 text-slate-500 text-[10px]">
                No current bulletin alerts registered in your archive.
              </p>
            )}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bulletins title, body text, or poster name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 transition-all font-semibold font-mono"
          />
        </div>

        {/* View Mode Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500 text-[10px] uppercase">Target:</span>
            <select
              value={audienceFilter}
              onChange={e => setAudienceFilter(e.target.value as any)}
              className="outline-none bg-transparent font-bold text-slate-700 pr-1.5"
            >
              <option value="Any">Any Audience</option>
              <option value="All">All Audiences</option>
              <option value="Teachers">Teachers</option>
              <option value="Parents">Parents</option>
              <option value="Students">Students</option>
            </select>
          </div>

          {/* Status filtering - ONLY teachers and admins can filter by Draft / Published */}
          {canPublish && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500 text-[10px] uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="outline-none bg-transparent font-bold text-slate-700 pr-1.5"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Drafts</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* CREATE FORM (ADMIN & TEACHER ACCESSIBLE) */}
      {showForm && canPublish && (
        <form onSubmit={publishAnnouncement} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in" id="form-create-bulletin">
          <div className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px]">Create Academic Notice Bulletin</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-600 block">Publication Title *</label>
              <input
                name="title"
                required
                value={form.title}
                onChange={handleInput}
                placeholder="e.g. Mandatory End of Year Parent-Teacher Assembly"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Target Audience *</label>
              <select
                name="targetAudience"
                value={form.targetAudience}
                onChange={handleInput}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
              >
                <option value="All">All Audiences</option>
                <option value="Teachers">Teachers Only</option>
                <option value="Parents">Parents Only</option>
                <option value="Students">Students Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">Detailed Content Context *</label>
            <textarea
              name="content"
              required
              rows={4}
              value={form.content}
              onChange={handleInput}
              placeholder="Provide standard instructions, details, timings, checklist benchmarks..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 outline-none resize-none focus:bg-white focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600">Publication State:</span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: 'Published' }))}
                  className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider ${
                    form.status === 'Published'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: 'Draft' }))}
                  className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider ${
                    form.status === 'Draft'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Save as Draft
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {form.status === 'Published' ? 'Broadcast Bulletin Now' : 'Store Notice as Draft'}
            </button>
          </div>
        </form>
      )}

      {/* EDIT MODAL / DRAWER (ADMIN & TEACHER ACCESSIBLE) */}
      {editingAnn && canPublish && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in" id="edit-notice-modal">
          <form onSubmit={submitEdit} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-2xl max-w-2xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FilePenLine className="w-4 h-4 text-emerald-600" />
                Modify Notice Bulletin
              </h4>
              <button
                type="button"
                onClick={() => setEditingAnn(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-600 block">Bulletin Title *</label>
                <input
                  name="title"
                  required
                  value={editForm.title}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 text-slate-700 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Target Audience *</label>
                <select
                  name="targetAudience"
                  value={editForm.targetAudience}
                  onChange={handleEditInput}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition-colors font-semibold"
                >
                  <option value="All">All Audiences</option>
                  <option value="Teachers">Teachers Only</option>
                  <option value="Parents">Parents Only</option>
                  <option value="Students">Students Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Body Notice Content *</label>
              <textarea
                name="content"
                required
                rows={5}
                value={editForm.content}
                onChange={handleEditInput}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none resize-none focus:bg-white focus:border-emerald-600 text-slate-700 font-medium leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-600">Publication State:</span>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'Published' }))}
                    className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider ${
                      editForm.status === 'Published'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'Draft' }))}
                    className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider ${
                      editForm.status === 'Draft'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
                >
                  Apply Notice Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="announcements-cards-deck">
        {filteredAnnouncements.map((ann, idx) => {
          const isDraft = ann.status === 'Draft';
          return (
            <div
              key={ann.id || idx}
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] hover:shadow-md transition-all space-y-4 ${
                isDraft ? 'border-dashed border-slate-300 bg-slate-50/40 opacity-90' : 'border-slate-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getTargetBadgeColor(ann.targetAudience)}`}>
                        {ann.targetAudience === 'All' ? 'Audience: All' : `For: ${ann.targetAudience}`}
                      </span>
                      {isDraft && (
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 font-mono">
                          <EyeOff className="w-2.5 h-2.5 text-slate-500" />
                          Draft File
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-extrabold text-slate-800 text-xs md:text-sm leading-snug break-words">
                      {ann.title}
                    </h4>
                    
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{ann.createdAt || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100/30">
                  {ann.content}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-mono">
                  Posted by: <strong className="font-bold text-slate-600">{ann.postedBy || 'Admin Desk'}</strong>
                </div>

                {/* Edit & Delete Controls (Only available to Admins and Teachers with restrictions) */}
                {canPublish && (
                  <div className="flex items-center gap-1.5">
                    {/* Toggle publish button */}
                    <button
                      onClick={() => togglePublicationState(ann)}
                      className={`p-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isDraft
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isDraft ? "Publish notice immediately" : "Send notice back to Draft archives"}
                    >
                      {isDraft ? 'Publish' : 'Unpublish'}
                    </button>

                    <button
                      onClick={() => startEdit(ann)}
                      className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Edit bulletin context"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => removeAnnouncement(ann.id)}
                        className="text-slate-350 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-colors focus:ring-1 focus:ring-rose-200 cursor-pointer"
                        title="Delete announcement permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="col-span-full py-16 bg-white border border-slate-100 border-dashed rounded-3xl p-8 text-center text-slate-400 font-semibold" id="empty-notices-board">
            <Sparkles className="w-9 h-9 text-indigo-500 mx-auto mb-3 animate-pulse" />
            No school announcements or bulleted publications fit your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
