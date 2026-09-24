import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { api, keyStorage } from '../services/api';

const SERVICES = {
  gemini: {
    name: 'Gemini (Multimodal Vision & Analysis)',
    description: 'Multimodal visual reverse-engineering, narrative extraction & brand adaptation. Uses gemini-flash-lite-latest.',
    pricing_hint: 'Has generous free tier (15 RPM)',
    get_key_url: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
  },
  groq: {
    name: 'Groq (Whisper Large Audio Transcription)',
    description: 'Speech to text — ultra-fast Whisper Large v3 audio transcription engine.',
    pricing_hint: 'Free tier available · ~10x faster than real-time',
    get_key_url: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
  },
  rapidapi: {
    name: 'RapidAPI (Instagram Downloader)',
    description: 'Direct Instagram Reel and Carousel downloader fallback API.',
    pricing_hint: 'Optional · falls back to Cobalt and yt-dlp if blank',
    get_key_url: 'https://rapidapi.com',
    placeholder: 'Optional RapidAPI Key',
  },
  cobalt: {
    name: 'Cobalt API',
    description: 'Self-hosted or public Cobalt video download API instance.',
    pricing_hint: 'Default: https://co.wuk.sh',
    get_key_url: 'https://github.com/imputnet/cobalt',
    placeholder: 'https://co.wuk.sh',
  },
};

function maskKey(key) {
  if (!key || key.length < 8) return null;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default function ApiKeysModal({ isOpen, onClose, onKeysUpdated }) {
  const [storedKeys, setStoredKeys] = useState({});
  const [inputs, setInputs] = useState({});
  const [actionState, setActionState] = useState({}); // { [service]: { saving, testing, message, success } }

  useEffect(() => {
    if (isOpen) {
      loadLocalKeys();
    }
  }, [isOpen]);

  const loadLocalKeys = () => {
    const keys = keyStorage.getAllKeys();
    setStoredKeys(keys);
  };

  const setStatus = (service, stateObj) => {
    setActionState((prev) => ({
      ...prev,
      [service]: { ...(prev[service] || {}), ...stateObj },
    }));
  };

  const handleSave = (service) => {
    const val = inputs[service];
    if (!val || !val.trim()) return;

    keyStorage.setKey(service, val.trim());
    loadLocalKeys();
    setInputs((prev) => ({ ...prev, [service]: '' }));
    setStatus(service, {
      saving: false,
      success: true,
      message: 'Saved to your browser storage (private to you)!',
    });
    if (onKeysUpdated) onKeysUpdated();
  };

  const handleTest = async (service) => {
    const keyToTest = (inputs[service] && inputs[service].trim()) || storedKeys[service];
    if (!keyToTest) {
      setStatus(service, {
        testing: false,
        success: false,
        message: 'Please paste a key to test.',
      });
      return;
    }

    setStatus(service, { testing: true, message: null });
    try {
      const res = await api.testKey(service, keyToTest);
      setStatus(service, {
        testing: false,
        success: res.success,
        message: res.message,
      });
      if (res.success && inputs[service]) {
        keyStorage.setKey(service, inputs[service].trim());
        loadLocalKeys();
        setInputs((prev) => ({ ...prev, [service]: '' }));
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

  const handleRemove = (service) => {
    keyStorage.removeKey(service);
    loadLocalKeys();
    setStatus(service, {
      success: true,
      message: 'Key removed from your browser.',
    });
    if (onKeysUpdated) onKeysUpdated();
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
              <h2 className="text-base font-bold text-white">Your Personal API Keys (BYOK)</h2>
              <p className="text-xs text-slate-400">Stored locally in your own browser — never shared with other team members</p>
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
          {servicesList.map((serviceKey) => {
            const item = SERVICES[serviceKey];
            const currentKey = storedKeys[serviceKey];
            const isConnected = bool(currentKey);
            const state = actionState[serviceKey] || {};
            const inputValue = inputs[serviceKey] || '';

            function bool(val) {
              return Boolean(val && val.length > 5);
            }

            return (
              <div key={serviceKey} className="pt-6 first:pt-0 space-y-3">
                {/* Top Bar: Name + Connected Pill + Link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-sm text-white">{item.name}</span>

                    {/* Status Pill Badge */}
                    {isConnected ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>configured · {maskKey(currentKey) || 'active'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        not configured
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
                      isConnected
                        ? 'replace your key'
                        : item.placeholder || 'paste your key'
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
                      disabled={!inputValue.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => handleTest(serviceKey)}
                      disabled={state.testing || (!inputValue.trim() && !isConnected)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
                    >
                      {state.testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <span>Test</span>
                      )}
                    </button>

                    {isConnected && (
                      <button
                        onClick={() => handleRemove(serviceKey)}
                        title="Remove key from browser"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition border border-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
