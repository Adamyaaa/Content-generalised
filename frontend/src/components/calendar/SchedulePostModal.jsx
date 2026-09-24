import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Share2,
  MessageSquare,
  Video,
  FileText,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';

export const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn Post', icon: Share2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'instagram', label: 'Instagram Reel', icon: Video, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'whatsapp', label: 'WhatsApp Broadcast', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'tiktok', label: 'TikTok Video', icon: Video, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'youtube_shorts', label: 'YouTube Shorts', icon: Video, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 'x_twitter', label: 'X / Twitter Thread', icon: Share2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { id: 'newsletter', label: 'Newsletter Drop', icon: FileText, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'custom', label: 'Custom Format', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
];

export const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft / Idea', color: 'bg-slate-700 text-slate-300' },
  { id: 'production', label: 'In Production', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'qa_approved', label: 'QA Approved', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'published', label: 'Published', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'archived', label: 'Archived', color: 'bg-slate-800 text-slate-500 border-slate-700' },
];

export default function SchedulePostModal({
  isOpen,
  onClose,
  initialData = null,
  activeProfile = null,
  profiles = [],
  onSaved = () => {},
  onDeleted = () => {}
}) {
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    concept_id: null,
    platform: 'linkedin',
    title: '',
    content: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    status: 'scheduled',
    qa_score: null,
    source_formula: '',
    notes: '',
    published_url: ''
  });

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          client_id: initialData.client_id || activeProfile?.client_id || (profiles[0]?.client_id ?? ''),
          client_name: initialData.client_name || activeProfile?.company_name || (profiles[0]?.company_name ?? ''),
          concept_id: initialData.concept_id || null,
          platform: initialData.platform || 'linkedin',
          title: initialData.title || '',
          content: initialData.content || '',
          scheduled_date: initialData.scheduled_date || new Date().toISOString().split('T')[0],
          scheduled_time: initialData.scheduled_time || '09:00',
          status: initialData.status || 'scheduled',
          qa_score: initialData.qa_score ?? null,
          source_formula: initialData.source_formula || '',
          notes: initialData.notes || '',
          published_url: initialData.published_url || ''
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          client_id: activeProfile?.client_id || (profiles[0]?.client_id ?? ''),
          client_name: activeProfile?.company_name || (profiles[0]?.company_name ?? ''),
          concept_id: null,
          platform: 'linkedin',
          title: '',
          content: '',
          scheduled_date: today,
          scheduled_time: '09:00',
          status: 'scheduled',
          qa_score: null,
          source_formula: '',
          notes: '',
          published_url: ''
        });
      }
      setError('');
    }
  }, [isOpen, initialData, activeProfile, profiles]);

  if (!isOpen) return null;

  const handleBrandChange = (e) => {
    const selectedClientId = e.target.value;
    const matched = profiles.find((p) => p.client_id === selectedClientId);
    setFormData((prev) => ({
      ...prev,
      client_id: selectedClientId,
      client_name: matched?.company_name || ''
    }));
  };

  const handleCopyContent = () => {
    if (!formData.content) return;
    navigator.clipboard.writeText(formData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a title or hook for the post.');
      return;
    }
    if (!formData.content.trim()) {
      setError('Post body or script content is required.');
      return;
    }
    if (!formData.scheduled_date) {
      setError('Please choose a scheduled date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        const updated = await api.updateCalendarEvent(formData.id, formData);
        onSaved(updated);
      } else {
        const created = await api.createCalendarEvent(formData);
        onSaved(created);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save calendar event:', err);
      setError(err.response?.data?.detail || 'Failed to save event. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (!window.confirm('Are you sure you want to remove this post from the calendar?')) return;

    try {
      await api.deleteCalendarEvent(formData.id);
      onDeleted(formData.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event.');
    }
  };

  const charCount = formData.content.length;
  const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Scheduled Post' : 'Schedule Content to Calendar'}
              </h2>
              <p className="text-xs text-slate-400">
                Plan multi-channel distribution, set publish dates, and track production status.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Top Row: Brand & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Profile Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client / Brand Profile
              </label>
              <select
                value={formData.client_id}
                onChange={handleBrandChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {profiles.map((p) => (
                  <option key={p.client_id} value={p.client_id}>
                    {p.company_name} ({p.industry || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Platform / Channel
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Time (24h)</span>
              </label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workflow Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title / Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post Headline / Working Title
            </label>
            <input
              type="text"
              placeholder="e.g., The Silent $40k/Month Cloud CI Leak & How We Fixed It"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600 font-semibold"
              required
            />
          </div>

          {/* Post Content / Script Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
                <span>Content Body / Spoken Reel Script</span>
                {formData.qa_score && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    QA Score: {formData.qa_score}/100
                  </span>
                )}
              </label>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 ml-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              placeholder="Enter your high-authority text post, spoken video script, or broadcast copy..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans placeholder-slate-600 resize-y"
              required
            />
          </div>

          {/* Optional: Editorial Notes & Live Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Internal Production Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Needs screenshot of terminal dashboard"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Published Live URL (When live)
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/posts/..."
                value={formData.published_url}
                onChange={(e) => setFormData({ ...formData, published_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Post</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update Post' : 'Schedule Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
