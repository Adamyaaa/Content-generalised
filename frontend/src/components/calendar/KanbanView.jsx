import React, { useState } from 'react';
import {
  Share2,
  Video,
  MessageSquare,
  Sparkles,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { PLATFORMS, STATUS_OPTIONS } from './SchedulePostModal';

const PIPELINE_COLUMNS = [
  { id: 'draft', label: 'Drafts & Ideas', color: 'border-slate-700 bg-slate-850' },
  { id: 'production', label: 'In Production', color: 'border-indigo-500/30 bg-indigo-950/20' },
  { id: 'qa_approved', label: 'QA Approved', color: 'border-amber-500/30 bg-amber-950/20' },
  { id: 'scheduled', label: 'Scheduled', color: 'border-blue-500/30 bg-blue-950/20' },
  { id: 'published', label: 'Published', color: 'border-emerald-500/30 bg-emerald-950/20' },
];

export default function KanbanView({
  events = [],
  onSelectEvent = () => {},
  onCreateEvent = () => {},
  onStatusChange = () => {}
}) {
  const [draggedEventId, setDraggedEventId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, eventId) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId && targetStatus) {
      onStatusChange(eventId, targetStatus);
    }
    setDraggedEventId(null);
    setDragOverColumn(null);
  };

  const getPlatformMeta = (platformId) => {
    return PLATFORMS.find((p) => p.id === platformId) || {
      id: 'custom',
      label: 'Custom',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map((col) => {
        const colEvents = events.filter((e) => e.status === col.id);
        const isDragTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border transition bg-slate-900/90 min-h-[500px] shadow-sm ${
              isDragTarget ? 'ring-2 ring-emerald-400 bg-slate-850' : 'border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white tracking-wide">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                  {colEvents.length}
                </span>
              </div>

              <button
                onClick={() => onCreateEvent(null, col.id)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title={`Create new ${col.label} item`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[65vh]">
              {colEvents.length > 0 ? (
                colEvents.map((evt) => {
                  const platformMeta = getPlatformMeta(evt.platform);
                  const Icon = platformMeta.icon;

                  return (
                    <div
                      key={evt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, evt.id)}
                      onClick={() => onSelectEvent(evt)}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-sm flex flex-col space-y-2.5 active:scale-95"
                    >
                      {/* Top: Platform & Scheduled Date */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${platformMeta.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{platformMeta.label.split(' ')[0]}</span>
                        </div>

                        <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{evt.scheduled_date}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition line-clamp-2 leading-snug">
                        {evt.title}
                      </h4>

                      {/* Content Snippet */}
                      <p className="text-[11px] text-slate-400 line-clamp-2 font-sans leading-relaxed">
                        {evt.content}
                      </p>

                      {/* Footer: Brand Name & QA Score */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                        <span className="truncate max-w-[120px]">{evt.client_name}</span>
                        {evt.qa_score && (
                          <span className="flex items-center space-x-0.5 text-emerald-400 font-mono font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{evt.qa_score}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-center p-3 text-slate-600">
                  <span className="text-xs">No posts in this stage</span>
                  <span className="text-[10px] text-slate-500 mt-1">Drag cards here or click +</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
