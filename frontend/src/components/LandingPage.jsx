import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers,
  Cpu,
  Eye,
  Film,
  CheckCircle2,
  Share2,
  FileText,
  Sliders,
  Key,
  Compass,
  Check
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, onOpenApiKeysModal, activeProfile }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release / Announcement Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8 animate-fade-in shadow-sm shadow-emerald-500/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Viral Content Reverse-Engineering</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
          <span className="text-slate-400 font-normal">Multi-Platform Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Reverse-engineer viral reels. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Adapt to your brand voice.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Deconstruct the psychological hooks, pacing, and observable claims of high-performing social content. 
          Instantly generate high-authority LinkedIn posts, Instagram Reels, and WhatsApp broadcasts with zero AI clichés.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Open ContentEngine Workspace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={onOpenApiKeysModal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-sm font-semibold transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Manage API Keys</span>
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-b border-slate-800/80 py-6">
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">0</div>
            <div className="text-xs text-slate-400 mt-0.5">Emojis & Generic Buzzwords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">Brand Voice Calibration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">3 Formats</div>
            <div className="text-xs text-slate-400 mt-0.5">LinkedIn, IG Reel, WhatsApp</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-400 tracking-tight">&lt; 30s</div>
            <div className="text-xs text-slate-400 mt-0.5">Multimodal Analysis Speed</div>
          </div>
        </div>

        {/* Interactive Feature Visual Preview */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur text-left max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">ContentEngine Pipeline • Ingestion to Adaptation</span>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Active Mode: Autonomous QA &gt;= 80
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Step A */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2">
                <Film className="w-4 h-4" />
                <span>1. Ingest & Keyframes</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Extracts raw video, 16kHz audio stream via FFmpeg, and samples 5-7 distinct visual keyframes to map scene transitions.
              </p>
            </div>

            {/* Step B */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-2">
                <Cpu className="w-4 h-4" />
                <span>2. Reverse-Engineer</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Groq Whisper transcribes speech. Gemini Flash deconstructs psychological hooks, pacing, and concrete claims into an abstract formula.
              </p>
            </div>

            {/* Step C */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Multi-Format QA</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Synthesizes brand-aligned drafts for LinkedIn, Instagram, and WhatsApp. Evaluates with dynamic QA audit against brand guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for Precision, Not Generic AI Fluff
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every step of the ingestion and generation pipeline is strictly calibrated to protect brand authority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Multi-Tier Download Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bypasses platform bot-detection using LinkedIn Twitterbot bypass, RapidAPI, Cobalt fallback, and local yt-dlp with automated FFmpeg path injection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Keyframe & Claim Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect extracted keyframes side-by-side with original video. Isolates verifiable claims and architectural stats so you can verify facts before publishing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Dynamic Anti-AI Evaluation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous editorial review grades hook disruptiveness, ICP relevance, and anti-AI authenticity. Automatic revision loop triggers if quality falls below 80/100.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Step-By-Step */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How ContentEngine Works</h2>
          <p className="text-sm text-slate-400 mt-2">From viral video link to 3 production-ready deliverables in 4 steps.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
              01
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Paste URL or Drop Video File</h4>
              <p className="text-xs text-slate-400 mt-1">
                Supports Instagram Reels, LinkedIn videos, YouTube Shorts/clips, TikToks, or direct MP4/MOV uploads.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
              02
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Extract Media, Transcripts & Keyframes</h4>
              <p className="text-xs text-slate-400 mt-1">
                FFmpeg strips audio for Groq Whisper large-v3 transcription and captures 5-7 spaced visual keyframes.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
              03
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Multimodal Reverse-Engineering</h4>
              <p className="text-xs text-slate-400 mt-1">
                Gemini Flash deconstructs the source psychological triggers, narrative pacing, observable claims, and repeatable formula.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
              04
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Brand Adaptation & QA Scoring</h4>
              <p className="text-xs text-slate-400 mt-1">
                Synthesizes ready-to-post drafts for LinkedIn, Instagram Reels, and WhatsApp Broadcasts, followed by rigorous editorial scoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 border-t border-slate-900 bg-gradient-to-b from-slate-900/30 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Ready to decode your next viral campaign?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Switch between brand profiles, connect your Gemini/Groq keys, and generate high-authority social copy in seconds.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchApp}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
            >
              <span>Launch ContentEngine Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
