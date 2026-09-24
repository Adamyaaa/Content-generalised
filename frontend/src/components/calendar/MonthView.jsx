import React, { useState } from 'react';
import {
  Share2,
  Video,
  MessageSquare,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthView({
  currentDate = new Date(),
  events = [],
  onSelectEvent = () => {},
  onCreateEvent = () => {},
  onReschedule = () => {}
}) {
  const [draggedEventId, setDraggedEventId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month & total days
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 for Sunday
  const lastDay = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDay.getDate();

  // Days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0];
    prevMonthDays.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Days of the current month
  const currentMonthDays = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    currentMonthDays.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  // Days from next month to fill remaining grid cells (to complete 35 or 42 grid cells)
  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCellsSoFar <= 35 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
  const nextMonthDays = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0];
    nextMonthDays.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Map events by date string
  const eventsByDate = {};
  events.forEach((evt) => {
    if (!eventsByDate[evt.scheduled_date]) {
      eventsByDate[evt.scheduled_date] = [];
    }
    eventsByDate[evt.scheduled_date].push(evt);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Drag and Drop handlers
  const handleDragStart = (e, eventId) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e, dateStr) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e, targetDateStr) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId && targetDateStr) {
      onReschedule(eventId, targetDateStr);
    }
    setDraggedEventId(null);
    setDragOverDate(null);
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'linkedin':
        return <Share2 className="w-3 h-3 text-blue-400 flex-shrink-0" />;
      case 'instagram':
      case 'tiktok':
      case 'youtube_shorts':
        return <Video className="w-3 h-3 text-rose-400 flex-shrink-0" />;
      case 'whatsapp':
        return <MessageSquare className="w-3 h-3 text-emerald-400 flex-shrink-0" />;
      default:
        return <FileText className="w-3 h-3 text-amber-400 flex-shrink-0" />;
    }
  };

  const getPlatformBg = (platform) => {
    switch (platform) {
      case 'linkedin':
        return 'bg-blue-950/50 hover:bg-blue-900/60 border-blue-800/60 text-blue-200';
      case 'instagram':
      case 'tiktok':
      case 'youtube_shorts':
        return 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-800/60 text-rose-200';
      case 'whatsapp':
        return 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-800/60 text-emerald-200';
      default:
        return 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'published':
        return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Published" />;
      case 'scheduled':
        return <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Scheduled" />;
      case 'qa_approved':
        return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="QA Approved" />;
      case 'production':
      case 'draft':
        return <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Draft / In Production" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-850">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={day}
            className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Calendar Grid Cells */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-950">
        {allCalendarDays.map(({ dayNumber, dateStr, isCurrentMonth }, idx) => {
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDate[dateStr] || [];
          const isTargetDrop = dragOverDate === dateStr;

          return (
            <div
              key={dateStr || idx}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
              className={`min-h-[115px] sm:min-h-[135px] p-2 sm:p-2.5 flex flex-col transition group relative ${
                !isCurrentMonth ? 'bg-slate-950/40 opacity-40' : 'bg-slate-900/40 hover:bg-slate-900/80'
              } ${isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-950/10' : ''} ${
                isTargetDrop ? 'ring-2 ring-emerald-400 bg-emerald-500/10 scale-[0.99]' : ''
              }`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                      isToday
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrentMonth
                        ? 'text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {dayNumber}
                  </span>
                  {isToday && (
                    <span className="hidden sm:inline text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>

                {/* Quick Add Button on Day Hover */}
                {isCurrentMonth && (
                  <button
                    onClick={() => onCreateEvent(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-400 transition cursor-pointer"
                    title={`Schedule post for ${dateStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Event Cards in Day Cell */}
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[120px] scrollbar-none">
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, evt.id)}
                    onClick={() => onSelectEvent(evt)}
                    className={`p-1.5 rounded-lg border text-left cursor-pointer transition shadow-sm ${getPlatformBg(
                      evt.platform
                    )} active:scale-95`}
                    title={`${evt.title} (${evt.scheduled_time || '09:00'}) - Drag to move`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center space-x-1 min-w-0">
                        {getPlatformIcon(evt.platform)}
                        <span className="text-[10px] font-mono text-slate-400">
                          {evt.scheduled_time || '09:00'}
                        </span>
                      </div>
                      {getStatusDot(evt.status)}
                    </div>

                    <p className="text-[11px] font-medium text-slate-200 line-clamp-1 leading-snug">
                      {evt.title}
                    </p>

                    {evt.client_name && (
                      <span className="text-[9px] text-slate-400 block truncate font-mono mt-0.5">
                        {evt.client_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
