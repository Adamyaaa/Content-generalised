import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_SERVICES = {
  gemini: {
    name: 'Gemini (Multimodal Vision & Analysis)',
    connected: false,
    description: 'Multimodal visual reverse-engineering, narrative extraction & brand adaptation. Uses gemini-flash-lite-latest.',
    pricing_hint: 'Has generous free tier (15 RPM)',
    get_key_url: 'https://aistudio.google.com/app/apikey',
  },
  groq: {
    name: 'Groq (Whisper Large Audio Transcription)',
    connected: false,
    description: 'Speech to text — ultra-fast Whisper Large v3 audio transcription engine.',
    pricing_hint: 'About $0.04 per audio hour · free tier available',
    get_key_url: 'https://console.groq.com/keys',
  },
  rapidapi: {
    name: 'RapidAPI (Instagram Downloader)',
    connected: false,
    description: 'Direct Instagram Reel and Carousel downloader fallback API.',
    pricing_hint: 'Optional · falls back to Cobalt and yt-dlp if blank',
    get_key_url: 'https://rapidapi.com',
  },
  cobalt: {
    name: 'Cobalt API',
    connected: false,
    description: 'Self-hosted or public Cobalt video download API instance (co.wuk.sh).',
    pricing_hint: 'Free & open-source community instances',
    get_key_url: 'https://github.com/imputnet/cobalt',
  },
};

export default function ApiKeysModal({ isOpen, onClose, onKeysUpdated }) {
  const [keysData, setKeysData] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [inputs, setInputs] = useState({});
  const [actionState, setActionState] = useState({}); // { [service]: { saving, testing, removing, message, success } }

  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen]);

  const loadKeys = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getKeysStatus();
      if (data && typeof data === 'object') {
        setKeysData((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load keys from backend:', err);
      const backendUrl = import.meta.env.VITE_API_BASE_URL;
      if (!backendUrl) {
        setLoadError(
          'Backend API URL (VITE_API_BASE_URL) is not configured in Vercel. Set VITE_API_BASE_URL in Vercel project settings to your Render backend URL.'
        );
      } else {
        setLoadError(
          `Could not connect to backend at ${backendUrl}. The backend service might still be booting up.`
        );
      }
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
    if (!val || !val.trim()) return;

    setStatus(service, { saving: true, message: null });
    try {
      await api.saveKey(service, val.trim());
      setStatus(service, {
        saving: false,
        success: true,
        message: 'Key saved and activated in database!',
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

  const servicesList = ['gemini', 'groq', 'rapidapi', 'cobalt'];

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
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">API Keys & Integrations</h2>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400">Configure AI models, speech-to-text, and download providers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadKeys}
              title="Refresh connection status"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Backend Warning Banner if unreachable */}
        {loadError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">Backend Connection Notice</p>
              <p className="text-[11px] text-amber-200/80">{loadError}</p>
            </div>
          </div>
        )}

        {/* Body: Providers list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-slate-800/80">
          {servicesList.map((serviceKey) => {
            const item = keysData[serviceKey] || DEFAULT_SERVICES[serviceKey];
            if (!item) return null;

            const state = actionState[serviceKey] || {};
            const inputValue = inputs[serviceKey] || '';

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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
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

                {/* Input field row + Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type={serviceKey === 'cobalt' ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder={
                      item.connected
                        ? 'replace the key'
                        : 'paste your key'
                    }
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
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                    >
                      {state.saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => handleTest(serviceKey)}
                      disabled={state.testing || (!inputValue.trim() && !item.connected)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
                    >
                      {state.testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <span>Test</span>
                      )}
                    </button>

                    {item.connected && (
                      <button
                        onClick={() => handleRemove(serviceKey)}
                        disabled={state.removing}
                        title="Remove key"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition border border-red-500/20"
                      >
                        {state.removing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Message */}
                {state.message && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 ${
                      state.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span>{state.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
