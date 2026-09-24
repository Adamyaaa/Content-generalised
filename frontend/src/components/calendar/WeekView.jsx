import React, { useState } from 'react';
import {
  Share2,
  Video,
  MessageSquare,
  Sparkles,
  Plus,
  Clock,
  Check,
  Copy,
  CheckCircle2,
  ShieldCheck,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PLATFORMS, STATUS_OPTIONS } from './SchedulePostModal';

export default function WeekView({
  currentDate = new Date(),
  events = [],
  onSelectEvent = () => {},
  onCreateEvent = () => {}
}) {
  const [copiedId, setCopiedId] = useState(null);

  // Calculate start of the week (Sunday) for currentDate
  const startOfWeek = new Date(currentDate);
  const dayIndex = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

  // 7 days of this week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    weekDays.push({
      date: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: dateStr === new Date().toISOString().split('T')[0]
    });
  }

  // Group events by date
  const eventsByDate = {};
  events.forEach((evt) => {
    if (!eventsByDate[evt.scheduled_date]) {
      eventsByDate[evt.scheduled_date] = [];
    }
    eventsByDate[evt.scheduled_date].push(evt);
  });

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformMeta = (platformId) => {
    return PLATFORMS.find((p) => p.id === platformId) || {
      id: 'custom',
      label: 'Custom Post',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    };
  };

  const getStatusMeta = (statusId) => {
    return STATUS_OPTIONS.find((s) => s.id === statusId) || {
      id: 'scheduled',
      label: 'Scheduled',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map(({ dateStr, dayName, monthDay, isToday }) => {
          const dayEvents = eventsByDate[dateStr] || [];

          return (
            <div
              key={dateStr}
              className={`bg-slate-900 border rounded-2xl p-3 flex flex-col min-h-[400px] shadow-sm transition ${
                isToday ? 'border-emerald-500/50 bg-slate-900/90 ring-1 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{dayName}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{monthDay}</span>
                </div>

                <button
                  onClick={() => onCreateEvent(dateStr)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-400 transition cursor-pointer"
                  title={`Add post for ${monthDay}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Events List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {dayEvents.length > 0 ? (
                  dayEvents.map((evt) => {
                    const platformMeta = getPlatformMeta(evt.platform);
                    const statusMeta = getStatusMeta(evt.status);
                    const Icon = platformMeta.icon;

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onSelectEvent(evt)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer group shadow-sm flex flex-col justify-between space-y-2"
                      >
                        {/* Platform and Time Header */}
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${platformMeta.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{platformMeta.label.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{evt.scheduled_time || '09:00'}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition line-clamp-2 leading-snug">
                          {evt.title}
                        </h4>

                        {/* Content Snippet */}
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed font-sans">
                          {evt.content}
                        </p>

                        {/* Footer Meta & Copy Shortcut */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>

                          <button
                            onClick={(e) => handleCopy(e, evt.content, evt.id)}
                            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition"
                            title="Copy post copy to clipboard"
                          >
                            {copiedId === evt.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-xl text-center p-2 text-slate-600">
                    <span className="text-[11px]">No posts scheduled</span>
                    <button
                      onClick={() => onCreateEvent(dateStr)}
                      className="text-[10px] text-emerald-400 hover:underline mt-1 cursor-pointer font-medium"
                    >
                      + Schedule here
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
