import React, { useState } from 'react';
import { Calendar, Trash2, ExternalLink, ShieldCheck, Zap, MessageSquare, Video, Share2 } from 'lucide-react';
import { api } from '../services/api';

export default function ConceptCard({ concept, onSelect, onDeleteSuccess, onSchedule }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await api.deleteConcept(concept.id);
      onDeleteSuccess(concept.id);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleScheduleClick = (e) => {
    e.stopPropagation();
    if (onSchedule) {
      onSchedule(concept);
    }
  };

  const qaScore = concept.qa_evaluation?.total_score || 0;
  const getScoreColor = (score) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 80) return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    if (score >= 65) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  const formattedDate = concept.created_at
    ? new Date(concept.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <div
      onClick={() => onSelect(concept.id)}
      className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-emerald-950/20 hover:shadow-2xl relative"
    >
      <div>
        {/* Card Header: Client & QA Score & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold tracking-wide">
            {concept.client_name}
          </span>

          <div className="flex items-center space-x-2">
            {/* QA Score Badge */}
            <div
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getScoreColor(
                qaScore
              )}`}
              title="Brand QA Score (>=80 required)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{qaScore}/100</span>
            </div>

            {/* Schedule shortcut button */}
            {onSchedule && (
              <button
                onClick={handleScheduleClick}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition cursor-pointer"
                title="Schedule to Content Calendar"
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}

            {/* Delete button (hover action) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {showConfirm ? (
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-red-500/40">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                  >
                    {deleting ? '...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete concept"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
          {concept.title}
        </h3>

        {/* Extracted Psychology Formula Tag */}
        {concept.source_formula && (
          <div className="mt-2.5 flex items-start space-x-1.5 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
              {concept.source_formula}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Platforms & Date */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-400 text-xs">
          <span className="flex items-center space-x-1" title="LinkedIn Ready">
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px]">LinkedIn</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1" title="Instagram Reel Script">
            <Video className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px]">Reel</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1" title="WhatsApp Broadcast">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">WhatsApp</span>
          </span>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
