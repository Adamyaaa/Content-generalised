import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function ApiKeysModal({ isOpen, onClose, onKeysUpdated }) {
  const [keysData, setKeysData] = useState({});
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [secondaryInputs, setSecondaryInputs] = useState({});
  const [actionState, setActionState] = useState({}); // { [service]: { saving, testing, removing, message, success } }

  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen]);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await api.getKeysStatus();
      setKeysData(data);
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (service, stateObj) => {
    setActionState((prev) => ({
      ...prev,
      [service]: { ...(prev[service] || {}), ...stateObj },
    }));
  };

  const handleSave = async (service) => {
    const val = inputs[service];
    const secVal = secondaryInputs[service];
    if (!val || !val.trim()) return;

    setStatus(service, { saving: true, message: null });
    try {
      await api.saveKey(service, val.trim(), secVal ? secVal.trim() : null);
      setStatus(service, {
        saving: false,
        success: true,
        message: 'Key saved and activated!',
      });
      setInputs((prev) => ({ ...prev, [service]: '' }));
      await loadKeys();
      if (onKeysUpdated) onKeysUpdated();
    } catch (err) {
      setStatus(service, {
        saving: false,
        success: false,
        message: err.response?.data?.detail || err.message,
      });
    }
  };

  const handleTest = async (service) => {
    const val = inputs[service];
    setStatus(service, { testing: true, message: null });
    try {
      const res = await api.testKey(service, val ? val.trim() : null);
      setStatus(service, {
        testing: false,
        success: res.success,
        message: res.message,
      });
      if (res.success && val) {
        await loadKeys();
        if (onKeysUpdated) onKeysUpdated();
      }
    } catch (err) {
      setStatus(service, {
        testing: false,
        success: false,
        message: err.response?.data?.detail || err.message,
      });
    }
  };

  const handleRemove = async (service) => {
    setStatus(service, { removing: true, message: null });
    try {
      await api.removeKey(service);
      setStatus(service, {
        removing: false,
        success: true,
        message: 'Key removed.',
      });
      setInputs((prev) => ({ ...prev, [service]: '' }));
      await loadKeys();
      if (onKeysUpdated) onKeysUpdated();
    } catch (err) {
      setStatus(service, {
        removing: false,
        success: false,
        message: err.message,
      });
    }
  };

  if (!isOpen) return null;

  const servicesList = ['gemini', 'groq', 'rapidapi', 'cobalt', 'supabase'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">API Keys & Integrations</h2>
              <p className="text-xs text-slate-400">Configure AI models, speech-to-text, and download providers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Providers list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-slate-800/80">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading provider configurations...</span>
            </div>
          ) : (
            servicesList.map((serviceKey) => {
              const item = keysData[serviceKey];
              if (!item) return null;

              const state = actionState[serviceKey] || {};
              const inputValue = inputs[serviceKey] || '';
              const secInputValue = secondaryInputs[serviceKey] || '';

              return (
                <div key={serviceKey} className="pt-6 first:pt-0 space-y-3">
                  {/* Top Bar: Name + Connected Pill + Link */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-sm text-white">{item.name}</span>

                      {/* Status Pill Badge */}
                      {item.connected ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>connected · {item.masked_key}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          not connected
                        </span>
                      )}
                    </div>

                    {item.get_key_url && (
                      <a
                        href={item.get_key_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition font-medium"
                      >
                        <span>Get a key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Subtitle / Description */}
                  <p className="text-xs text-slate-400">
                    {item.description} {item.pricing_hint && `· ${item.pricing_hint}`}
                  </p>

                  {/* Secondary input if Supabase (needs URL + Key) */}
                  {serviceKey === 'supabase' && (
                    <div>
                      <input
                        type="text"
                        placeholder="https://your-project.supabase.co"
                        value={secInputValue}
                        onChange={(e) =>
                          setSecondaryInputs({
                            ...secondaryInputs,
                            [serviceKey]: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 mb-2 font-mono"
                      />
                    </div>
                  )}

                  {/* Input field row + Action buttons (matching screenshot UX) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="password"
                      autoComplete="off"
                      placeholder={item.connected ? 'replace the key' : 'paste your key'}
                      value={inputValue}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          [serviceKey]: e.target.value,
                        })
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono tracking-wide"
                    />

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(serviceKey)}
                        disabled={state.saving || !inputValue.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition disabled:opacity-40"
                      >
                        {state.saving ? 'Saving...' : 'Save'}
                      </button>

                      <button
                        onClick={() => handleTest(serviceKey)}
                        disabled={state.testing || (!item.connected && !inputValue.trim())}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition disabled:opacity-40 flex items-center space-x-1.5"
                      >
                        {state.testing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <span>Test</span>
                        )}
                      </button>

                      {item.connected && (
                        <button
                          onClick={() => handleRemove(serviceKey)}
                          disabled={state.removing}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold border border-slate-800 hover:border-red-500/30 transition disabled:opacity-40"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Test or Save Result Message */}
                  {state.message && (
                    <div
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center space-x-2 ${
                        state.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {state.success ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{state.message}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
