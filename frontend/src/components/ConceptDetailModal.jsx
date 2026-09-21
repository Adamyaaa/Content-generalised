import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Video,
  Share2,
  MessageSquare,
  Zap,
  ShieldCheck,
  Film,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ConceptDetailModal({ conceptId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scenes'); // 'scenes', 'linkedin', 'instagram', 'whatsapp', 'psychology', 'qa'
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!conceptId) return;
    setLoading(true);
    api
      .getConceptDetails(conceptId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load concept details:', err);
        setLoading(false);
      });
  }, [conceptId]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!conceptId) return null;

  const concept = data?.concept;
  const analysis = data?.analysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                {concept?.client_name || 'Loading...'}
              </span>
              <span className="text-xs text-slate-400">Multi-Platform Adapted Concept</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 line-clamp-1">{concept?.title}</h2>
          </div>

          <div className="flex items-center space-x-3">
            {concept?.qa_evaluation && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                <span>QA Score: {concept.qa_evaluation.total_score}/100</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-6 scrollbar-none">
          {[
            { id: 'scenes', label: 'Video Script & Scenes', icon: Film },
            { id: 'linkedin', label: 'LinkedIn Post', icon: Share2 },
            { id: 'instagram', label: 'Instagram Reel', icon: Video },
            { id: 'whatsapp', label: 'WhatsApp Broadcast', icon: MessageSquare },
            { id: 'psychology', label: 'Viral Psychology Breakdown', icon: Zap },
            { id: 'qa', label: 'Brand QA Audit', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading concept breakdown...</div>
          ) : !concept ? (
            <div className="py-20 text-center text-red-400 text-sm">Failed to load concept details.</div>
          ) : (
            <>
              {/* TAB 1: VIDEO SCRIPT & SCENE BREAKDOWN */}
              {activeTab === 'scenes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Scene-by-Scene Video Production Breakdown</h3>
                      <p className="text-xs text-slate-400">Pacing, visual hooks, spoken voiceover, and kinetic text overlays</p>
                    </div>
                    <button
                      onClick={() => {
                        const fullScript = concept.scenes
                          .map(
                            (s) =>
                              `[${s.timestamp_range}] Scene ${s.scene_number}\nVisual: ${s.visual_cue}\nDialogue: ${s.voiceover_dialogue}\nOn-screen text: ${s.text_overlay}`
                          )
                          .join('\n\n');
                        copyToClipboard(fullScript, 'full_script');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition"
                    >
                      {copiedKey === 'full_script' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied Script!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Full Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {concept.scenes?.map((scene) => (
                      <div
                        key={scene.scene_number}
                        className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            Scene {scene.scene_number} ({scene.timestamp_range})
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            Overlay: {scene.text_overlay}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                            <span className="text-slate-500 font-semibold block mb-1">Visual Cue:</span>
                            <p className="text-slate-300 leading-relaxed">{scene.visual_cue}</p>
                          </div>
                          <div className="text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                            <span className="text-slate-500 font-semibold block mb-1">Spoken Voiceover (Zero Emojis):</span>
                            <p className="text-white font-medium leading-relaxed">{scene.voiceover_dialogue}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: LINKEDIN POST */}
              {activeTab === 'linkedin' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">High-Authority LinkedIn Breakdown</h3>
                      <p className="text-xs text-slate-400">Zero emojis, punchy line breaks, real numbers, and clear CTA</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(concept.platform_ideations.linkedin_post, 'linkedin')
                      }
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      {copiedKey === 'linkedin' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Post!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>One-Click Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {concept.platform_ideations.linkedin_post}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: INSTAGRAM REEL SCRIPT */}
              {activeTab === 'instagram' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Instagram Reel Script & Visual Directions</h3>
                      <p className="text-xs text-slate-400">Spoken audio word-for-word with visual direction, no emojis</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(concept.platform_ideations.instagram_reel_script, 'instagram')
                      }
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      {copiedKey === 'instagram' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Script!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>One-Click Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {concept.platform_ideations.instagram_reel_script}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: WHATSAPP BROADCAST */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-sm text-white">Direct WhatsApp Client Broadcast</h3>
                      <p className="text-xs text-slate-400">Conversational, high-value, direct message format for WhatsApp VIPs or groups</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(concept.platform_ideations.whatsapp_broadcast, 'whatsapp')
                      }
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      {copiedKey === 'whatsapp' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Message!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>One-Click Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {concept.platform_ideations.whatsapp_broadcast}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 5: VIRAL PSYCHOLOGY BREAKDOWN */}
              {activeTab === 'psychology' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Repeatable Viral Formula</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">{concept.source_formula}</p>
                  </div>

                  {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hook Analysis */}
                      <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Hook Mechanics ({analysis.hook_analysis.trigger_type})
                        </span>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-500 font-semibold block mb-1">Source Hook Text:</span>
                          <p className="text-white font-medium">"{analysis.hook_analysis.hook_text}"</p>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{analysis.hook_analysis.effectiveness_breakdown}</p>
                      </div>

                      {/* Visual Storytelling */}
                      <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Visual Storytelling & Pacing
                        </span>
                        <div className="text-xs space-y-1.5 text-slate-300">
                          <div>
                            <span className="text-slate-500">Framing:</span> {analysis.visual_storytelling.framing}
                          </div>
                          <div>
                            <span className="text-slate-500">Pacing:</span> {analysis.visual_storytelling.pacing_description}
                          </div>
                          <div>
                            <span className="text-slate-500">B-Roll:</span> {analysis.visual_storytelling.b_roll_dynamics}
                          </div>
                          <div>
                            <span className="text-slate-500">Text Overlays:</span> {analysis.visual_storytelling.text_density}
                          </div>
                        </div>
                      </div>

                      {/* Narrative Structure */}
                      <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 md:col-span-2 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Narrative Arc Breakdown
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 font-bold block mb-1">1. Problem</span>
                            <p className="text-slate-300 text-[11px]">{analysis.narrative_structure.problem}</p>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 font-bold block mb-1">2. Agitation</span>
                            <p className="text-slate-300 text-[11px]">{analysis.narrative_structure.agitation}</p>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 font-bold block mb-1">3. Insight</span>
                            <p className="text-slate-300 text-[11px]">{analysis.narrative_structure.insight}</p>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 font-bold block mb-1">4. Solution</span>
                            <p className="text-slate-300 text-[11px]">{analysis.narrative_structure.solution}</p>
                          </div>
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-500 font-bold block mb-1">5. Call to Action</span>
                            <p className="text-slate-300 text-[11px]">{analysis.narrative_structure.call_to_action}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: BRAND QA AUDIT */}
              {activeTab === 'qa' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-850 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Composite Brand QA Rating</span>
                      <h3 className="text-2xl font-extrabold text-white mt-0.5">
                        {concept.qa_evaluation?.total_score} / 100
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Must achieve 80+ to pass automated publishing gate.
                      </p>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{concept.qa_evaluation?.passed ? 'GATE PASSED' : 'REVISION REQUIRED'}</span>
                    </div>
                  </div>

                  {/* 4 Score Meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: 'Hook Strength',
                        score: concept.qa_evaluation?.hook_strength,
                        desc: 'Scroll-stopping power'
                      },
                      {
                        label: 'Brand Voice',
                        score: concept.qa_evaluation?.brand_voice_alignment,
                        desc: 'Tailored to client ICP'
                      },
                      {
                        label: 'Actionable Value',
                        score: concept.qa_evaluation?.specificity_and_value,
                        desc: 'Real numbers & proof'
                      },
                      {
                        label: 'Anti-AI Score',
                        score: concept.qa_evaluation?.anti_ai_score,
                        desc: 'Zero emojis, zero fluff'
                      }
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                        <span className="text-xs text-slate-400 font-medium block">{item.label}</span>
                        <div className="text-2xl font-bold text-emerald-400 my-1">{item.score}/10</div>
                        <span className="text-[11px] text-slate-500">{item.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Feedback Critique */}
                  <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 uppercase">QA Auditor Notes</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{concept.qa_evaluation?.feedback}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
