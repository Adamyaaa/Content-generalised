import React from 'react';
import { Sparkles, Sliders, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ activeProfile, onOpenProfileModal, onOpenApiKeysModal, healthInfo }) {
  const isAiConfigured = healthInfo?.gemini_configured && healthInfo?.groq_configured;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">ViralEngine</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                v1.0 • Anti-AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Content Reverse-Engineering & Brand Adaptation</p>
          </div>
        </div>

        {/* Right side: API Keys, Active Brand & Manage */}
        <div className="flex items-center space-x-3">
          {/* API Keys Configuration Button (styled like user's screenshot header) */}
          <button
            onClick={onOpenApiKeysModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isAiConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isAiConfigured ? 'API Keys Connected' : 'API Keys Settings'}</span>
          </button>

          {healthInfo && (
            <div className="hidden lg:flex items-center space-x-2 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400">
              <span className={`w-2 h-2 rounded-full ${healthInfo.ffmpeg_status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>FFmpeg: {healthInfo.ffmpeg_status}</span>
              <span className="text-slate-600">|</span>
              <span>Model: {healthInfo.gemini_model}</span>
            </div>
          )}

          {activeProfile && (
            <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Active Brand</div>
                <div className="text-sm font-semibold text-slate-100">{activeProfile.company_name}</div>
              </div>
              <button
                onClick={onOpenProfileModal}
                className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-750 text-slate-300 hover:text-white transition"
                title="Manage Brand Profiles"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
