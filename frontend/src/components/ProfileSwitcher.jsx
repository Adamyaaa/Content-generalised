import React, { useState } from 'react';
import { Plus, Building2, Check, X, ShieldAlert, Sparkles, ChevronDown, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function ProfileSwitcher({
  profiles,
  activeProfile,
  onSelectProfile,
  onProfileUpdated,
  isOpen,
  onClose,
}) {
  const [editingProfile, setEditingProfile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const initialForm = {
    company_name: '',
    industry: '',
    tagline_or_mission: '',
    products_and_services: [
      { name: '', core_value_prop: '', pain_points_solved: [''] }
    ],
    target_audience: {
      icp_description: '',
      primary_frustrations: [''],
      aspirations_and_goals: [''],
      cultural_or_market_context: ''
    },
    brand_voice_guidelines: {
      tone: 'Authoritative, technical, direct, zero emojis, grounded in numbers',
      prohibited_elements: ['No emojis', 'No buzzwords', 'No generic motivational cliches'],
      signature_angles: ['Real metrics & benchmarks', 'Architecture breakdowns'],
      primary_cta: 'Book an audit or request the technical blueprint.'
    }
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenEdit = (p) => {
    setEditingProfile(p);
    setIsCreating(false);
    setFormData({
      company_name: p.company_name,
      industry: p.industry,
      tagline_or_mission: p.tagline_or_mission,
      products_and_services: p.products_and_services?.length ? p.products_and_services : [{ name: '', core_value_prop: '', pain_points_solved: [''] }],
      target_audience: {
        icp_description: p.target_audience?.icp_description || '',
        primary_frustrations: p.target_audience?.primary_frustrations?.length ? p.target_audience.primary_frustrations : [''],
        aspirations_and_goals: p.target_audience?.aspirations_and_goals?.length ? p.target_audience.aspirations_and_goals : [''],
        cultural_or_market_context: p.target_audience?.cultural_or_market_context || ''
      },
      brand_voice_guidelines: {
        tone: p.brand_voice_guidelines?.tone || '',
        prohibited_elements: p.brand_voice_guidelines?.prohibited_elements?.length ? p.brand_voice_guidelines.prohibited_elements : ['No emojis'],
        signature_angles: p.brand_voice_guidelines?.signature_angles?.length ? p.brand_voice_guidelines.signature_angles : [''],
        primary_cta: p.brand_voice_guidelines?.primary_cta || ''
      }
    });
  };

  const handleOpenNew = () => {
    setEditingProfile(null);
    setIsCreating(true);
    setFormData(initialForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isCreating) {
        const created = await api.createProfile(formData);
        onProfileUpdated(created.client_id);
      } else if (editingProfile) {
        const updated = await api.updateProfile(editingProfile.client_id, formData);
        onProfileUpdated(updated.client_id);
      }
      setEditingProfile(null);
      setIsCreating(false);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand profile?')) return;
    try {
      await api.deleteProfile(id);
      onProfileUpdated();
      setEditingProfile(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Brand / Client Profile Manager</h2>
              <p className="text-xs text-slate-400">Configure target audience ICP, products, and anti-AI guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!editingProfile && !isCreating ? (
            /* Profile List Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Available Profiles ({profiles.length})</span>
                <button
                  onClick={handleOpenNew}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Client Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((p) => {
                  const isActive = activeProfile?.client_id === p.client_id;
                  return (
                    <div
                      key={p.client_id}
                      className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-slate-800/90 border-emerald-500/60 ring-1 ring-emerald-500/40'
                          : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => onSelectProfile(p)}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{p.industry}</span>
                            <h3 className="text-base font-bold text-white">{p.company_name}</h3>
                          </div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-2 line-clamp-2">{p.tagline_or_mission}</p>
                        <div className="mt-3 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 font-semibold block mb-0.5">Target ICP:</span>
                          <span className="line-clamp-2">{p.target_audience.icp_description}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-500">CTA: {p.brand_voice_guidelines.primary_cta}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(p);
                            }}
                            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
                          >
                            Edit
                          </button>
                          {profiles.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.client_id);
                              }}
                              className="p-1 text-xs rounded-md hover:bg-red-500/20 text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Create / Edit Form Mode */
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white">
                  {isCreating ? 'Create Brand Profile' : `Edit Profile: ${editingProfile?.company_name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setIsCreating(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back to profiles
                </button>
              </div>

              {/* Core Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g., Acme Health, DevFlow AI"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., B2B SaaS, HealthTech, FinTech"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mission / Tagline</label>
                <input
                  type="text"
                  required
                  value={formData.tagline_or_mission}
                  onChange={(e) => setFormData({ ...formData, tagline_or_mission: e.target.value })}
                  placeholder="Core value or overarching company mission"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Products & Services */}
              <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Product / Service Offerings</span>
                </div>
                {formData.products_and_services.map((prod, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) => {
                          const updated = [...formData.products_and_services];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, products_and_services: updated });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Core Value Proposition</label>
                      <input
                        type="text"
                        value={prod.core_value_prop}
                        onChange={(e) => {
                          const updated = [...formData.products_and_services];
                          updated[idx].core_value_prop = e.target.value;
                          setFormData({ ...formData, products_and_services: updated });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Target Audience (ICP) */}
              <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase">Target Audience (ICP)</span>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ICP Description</label>
                  <textarea
                    rows={2}
                    value={formData.target_audience.icp_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_audience: { ...formData.target_audience, icp_description: e.target.value }
                      })
                    }
                    placeholder="e.g. Seed to Series A technical founders, VP Engineering"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Market / Cultural Context</label>
                    <input
                      type="text"
                      value={formData.target_audience.cultural_or_market_context}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_audience: { ...formData.target_audience, cultural_or_market_context: e.target.value }
                        })
                      }
                      placeholder="e.g., ROI-conscious, WhatsApp-first communication"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Primary Frustrations (comma separated)</label>
                    <input
                      type="text"
                      value={formData.target_audience.primary_frustrations.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_audience: {
                            ...formData.target_audience,
                            primary_frustrations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          }
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Voice & Anti-AI Guidelines */}
              <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase">Brand Voice & Anti-AI Guidelines</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Voice Tone</label>
                    <input
                      type="text"
                      value={formData.brand_voice_guidelines.tone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand_voice_guidelines: { ...formData.brand_voice_guidelines, tone: e.target.value }
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Primary Call-To-Action (CTA)</label>
                    <input
                      type="text"
                      value={formData.brand_voice_guidelines.primary_cta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand_voice_guidelines: { ...formData.brand_voice_guidelines, primary_cta: e.target.value }
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Prohibited Elements (comma separated)</label>
                  <input
                    type="text"
                    value={formData.brand_voice_guidelines.prohibited_elements.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        brand_voice_guidelines: {
                          ...formData.brand_voice_guidelines,
                          prohibited_elements: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        }
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
