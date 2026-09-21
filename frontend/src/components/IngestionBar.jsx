import React, { useState, useEffect } from 'react';
import { Link2, Upload, Play, Loader2, CheckCircle2, AlertTriangle, FileVideo, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function IngestionBar({ activeProfile, onConceptGenerated }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'upload'
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQueueId, setActiveQueueId] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Poll queue status while processing
  useEffect(() => {
    if (!activeQueueId || !isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const statusData = await api.getQueueStatus(activeQueueId);
        setQueueStatus(statusData);

        if (statusData.status === 'generated') {
          setIsProcessing(false);
          setActiveQueueId(null);
          setUrlInput('');
          setSelectedFile(null);
          onConceptGenerated(statusData.concept_id);
        } else if (statusData.status === 'failed' || statusData.status === 'rejected') {
          setIsProcessing(false);
          setActiveQueueId(null);
          setErrorMessage(statusData.error_message || 'Processing failed');
        }
      } catch (err) {
        console.error('Queue poll error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeQueueId, isProcessing]);

  const handleSubmitUrl = async (e) => {
    e.preventDefault();
    if (!urlInput.trim() || !activeProfile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setQueueStatus({ status: 'pending', progress_message: 'Submitting URL to pipeline...' });

    try {
      const res = await api.ingestUrl(urlInput.trim(), activeProfile.client_id);
      setActiveQueueId(res.queue_id);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.response?.data?.detail || err.message);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !activeProfile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setQueueStatus({ status: 'pending', progress_message: 'Uploading media file...' });

    try {
      const res = await api.ingestFile(selectedFile, activeProfile.client_id);
      setActiveQueueId(res.queue_id);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.response?.data?.detail || err.message);
    }
  };

  const getStepNumber = (status) => {
    switch (status) {
      case 'ingesting': return 1;
      case 'extracting': return 2;
      case 'analyzing': return 3;
      case 'generating': return 4;
      case 'evaluating': return 5;
      case 'generated': return 6;
      default: return 0;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Reverse-Engineer Viral Content</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Adapt for: {activeProfile?.company_name}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest social posts or raw video, extract the psychological hook formula, and adapt for {activeProfile?.company_name}.
          </p>
        </div>

        {/* Ingestion Mode Toggle */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'url'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Social URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Direct Upload</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      {activeTab === 'url' ? (
        <form onSubmit={handleSubmitUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                disabled={isProcessing}
                placeholder="Paste YouTube Shorts, Instagram Reel, LinkedIn post, or TikTok link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !urlInput.trim()}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Reverse-Engineer</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 pl-1">
            <span>Supported:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">LinkedIn (Photo + Text bypass)</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">YouTube Shorts</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">Instagram Reels</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">TikTok</span>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFileUpload} className="space-y-3">
          <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-6 text-center bg-slate-950/50 transition">
            <input
              type="file"
              id="media-file-input"
              accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png"
              disabled={isProcessing}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="media-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition">
                <FileVideo className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div>
                  <span className="text-sm font-semibold text-emerald-400">{selectedFile.name}</span>
                  <span className="text-xs text-slate-500 block">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-medium text-slate-300">Click to upload video or drag and drop</span>
                  <span className="text-xs text-slate-500 block mt-1">MP4, MOV, WebM, or JPG/PNG (Up to 100MB)</span>
                </div>
              )}
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProcessing || !selectedFile}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Upload...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Reverse-Engineer Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Live Pipeline Tracker */}
      {isProcessing && queueStatus && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-semibold text-slate-200">
                {queueStatus.progress_message}
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Step {getStepNumber(queueStatus.status)}/5
            </span>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { id: 'ingest', label: '1. Ingest' },
              { id: 'extract', label: '2. Frames' },
              { id: 'analyze', label: '3. Reverse-Eng' },
              { id: 'adapt', label: '4. Adapt Brand' },
              { id: 'qa', label: '5. QA Audit' }
            ].map((step, idx) => {
              const currentStep = getStepNumber(queueStatus.status);
              const isDone = currentStep > idx + 1;
              const isCurrent = currentStep === idx + 1;
              return (
                <div
                  key={step.id}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : isCurrent
                      ? 'bg-slate-800 border-slate-700 text-white animate-pulse'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-600'
                  }`}
                >
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
