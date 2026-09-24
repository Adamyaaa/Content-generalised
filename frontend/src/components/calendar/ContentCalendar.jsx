import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Share2,
  Video,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  Columns3,
  CalendarDays,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import MonthView from './MonthView';
import WeekView from './WeekView';
import KanbanView from './KanbanView';
import CalendarStats from './CalendarStats';
import SchedulePostModal from './SchedulePostModal';
import { api } from '../../services/api';

export default function ContentCalendar({
  activeProfile = null,
  profiles = [],
  filterActiveBrandOnly = true,
  onToggleFilterActiveBrand = () => {}
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'kanban'
  const [platformFilter, setPlatformFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate, activeProfile, filterActiveBrandOnly, platformFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const params = {};

      if (filterActiveBrandOnly && activeProfile) {
        params.client_id = activeProfile.client_id;
      }
      if (platformFilter !== 'all') {
        params.platform = platformFilter;
      }

      const list = await api.getCalendarEvents(params);
      setEvents(list);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Month navigation
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === 'week') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Reschedule via drag and drop
  const handleReschedule = async (eventId, newDate) => {
    try {
      const updated = await api.rescheduleCalendarEvent(eventId, newDate);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (err) {
      console.error('Failed to reschedule post:', err);
    }
  };

  // Status update via Kanban
  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const updated = await api.updateCalendarEventStatus(eventId, newStatus);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (err) {
      console.error('Failed to update post status:', err);
    }
  };

  // Create post shortcut
  const handleCreateEvent = (dateStr = null, initialStatus = 'scheduled') => {
    setModalInitialData({
      client_id: activeProfile?.client_id || '',
      client_name: activeProfile?.company_name || '',
      scheduled_date: dateStr || new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      status: initialStatus,
      platform: 'linkedin',
      title: '',
      content: ''
    });
    setIsModalOpen(true);
  };

  // Edit event
  const handleSelectEvent = (event) => {
    setModalInitialData(event);
    setIsModalOpen(true);
  };

  const handleSaved = (savedEvent) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [...prev, savedEvent];
    });
  };

  const handleDeleted = (deletedId) => {
    setEvents((prev) => prev.filter((e) => e.id !== deletedId));
  };

  // Current view formatted title
  const formattedMonthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Calendar Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Month Navigator & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{formattedMonthYear}</span>
          </h2>
        </div>

        {/* Right: View Switcher, Filter, Export & Schedule Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setCalendarView('month')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                calendarView === 'month'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>

            <button
              onClick={() => setCalendarView('week')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                calendarView === 'week'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>

            <button
              onClick={() => setCalendarView('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                calendarView === 'kanban'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">All Channels</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram Reels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube_shorts">YouTube Shorts</option>
          </select>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-30 space-y-0.5"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <a
                  href={api.getExportCsvUrl(filterActiveBrandOnly && activeProfile ? activeProfile.client_id : null)}
                  download
                  onClick={() => setIsExportMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Download as CSV</span>
                </a>
                <a
                  href={api.getExportIcsUrl(filterActiveBrandOnly && activeProfile ? activeProfile.client_id : null)}
                  download
                  onClick={() => setIsExportMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition"
                >
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span>Export iCal (.ics feed)</span>
                </a>
              </div>
            )}
          </div>

          {/* Primary Action: + Schedule Post */}
          <button
            onClick={() => handleCreateEvent()}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Cadence Stats Banner */}
      <CalendarStats events={events} activeProfile={activeProfile} />

      {/* Main Calendar View Area */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">Loading content schedule...</div>
      ) : calendarView === 'month' ? (
        <MonthView
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
          onReschedule={handleReschedule}
        />
      ) : calendarView === 'week' ? (
        <WeekView
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
        />
      ) : (
        <KanbanView
          events={events}
          onSelectEvent={handleSelectEvent}
          onCreateEvent={handleCreateEvent}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Schedule / Edit Post Modal */}
      <SchedulePostModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialData(null);
        }}
        initialData={modalInitialData}
        activeProfile={activeProfile}
        profiles={profiles}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
