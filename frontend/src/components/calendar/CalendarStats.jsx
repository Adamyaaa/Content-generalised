import React from 'react';
import {
  Calendar,
  Share2,
  Video,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function CalendarStats({ events = [], activeProfile = null }) {
  const totalPosts = events.length;

  // Platform counts
  const linkedinCount = events.filter((e) => e.platform === 'linkedin').length;
  const instagramCount = events.filter((e) => e.platform === 'instagram' || e.platform === 'tiktok' || e.platform === 'youtube_shorts').length;
  const whatsappCount = events.filter((e) => e.platform === 'whatsapp').length;
  const otherCount = totalPosts - (linkedinCount + instagramCount + whatsappCount);

  // Status counts
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const scheduledCount = events.filter((e) => e.status === 'scheduled').length;
  const inProductionCount = events.filter((e) => e.status === 'production' || e.status === 'draft').length;

  // Average QA score of scheduled content if available
  const postsWithQa = events.filter((e) => e.qa_score);
  const avgQaScore = postsWithQa.length > 0
    ? Math.round(postsWithQa.reduce((acc, curr) => acc + curr.qa_score, 0) / postsWithQa.length)
    : 85;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Overall Stats Summary */}
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {activeProfile ? `${activeProfile.company_name} Strategy` : 'Multi-Brand Content Strategy'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                {totalPosts} Total Content Assets
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-300">
              <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{publishedCount} Published</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center space-x-1 text-blue-400 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>{scheduledCount} Scheduled</span>
              </span>
              {inProductionCount > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-medium">
                    {inProductionCount} In Pipeline
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Platform Distribution Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300">
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>LinkedIn: {linkedinCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300">
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>Reels / Video: {instagramCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp: {whatsappCount}</span>
          </div>

          {postsWithQa.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300" title="Average QA Score across scheduled concepts">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg QA: {avgQaScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Platform Proportion Bar */}
      {totalPosts > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {linkedinCount > 0 && (
              <div
                style={{ width: `${(linkedinCount / totalPosts) * 100}%` }}
                className="bg-blue-500 h-full"
                title={`LinkedIn: ${Math.round((linkedinCount / totalPosts) * 100)}%`}
              />
            )}
            {instagramCount > 0 && (
              <div
                style={{ width: `${(instagramCount / totalPosts) * 100}%` }}
                className="bg-rose-500 h-full"
                title={`Instagram/Reels: ${Math.round((instagramCount / totalPosts) * 100)}%`}
              />
            )}
            {whatsappCount > 0 && (
              <div
                style={{ width: `${(whatsappCount / totalPosts) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`WhatsApp: ${Math.round((whatsappCount / totalPosts) * 100)}%`}
              />
            )}
            {otherCount > 0 && (
              <div
                style={{ width: `${(otherCount / totalPosts) * 100}%` }}
                className="bg-amber-500 h-full"
                title={`Other: ${Math.round((otherCount / totalPosts) * 100)}%`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
