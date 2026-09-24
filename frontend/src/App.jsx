import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Building2,
  Filter,
  Search,
  PlusCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import Navbar from './components/Navbar';
import ProfileSwitcher from './components/ProfileSwitcher';
import IngestionBar from './components/IngestionBar';
import ConceptCard from './components/ConceptCard';
import ConceptDetailModal from './components/ConceptDetailModal';
import ApiKeysModal from './components/ApiKeysModal';
import LandingPage from './components/LandingPage';
import ContentCalendar from './components/calendar/ContentCalendar';
import SchedulePostModal from './components/calendar/SchedulePostModal';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('app'); // 'landing' | 'app' | 'calendar'
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActiveBrandOnly, setFilterActiveBrandOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  // Global Schedule Modal State (for scheduling from ConceptCard or DetailModal)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalData, setScheduleModalData] = useState(null);

  // Load initial health, profiles, and concepts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [health, profileList] = await Promise.all([
        api.getHealth().catch((e) => ({ ffmpeg_status: 'unknown', gemini_model: 'gemini-flash-lite-latest' })),
        api.getProfiles().catch((e) => [])
      ]);

      setHealthInfo(health);
      setProfiles(profileList);

      const initialActive = profileList.length > 0 ? profileList[0] : null;
      setActiveProfile(initialActive);

      if (initialActive) {
        loadConcepts(initialActive.client_id);
      } else {
        loadConcepts(null);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConcepts = async (clientId = null) => {
    try {
      const list = await api.getConcepts(clientId);
      setConcepts(list);
    } catch (err) {
      console.error('Failed to load concepts:', err);
    }
  };

  const handleProfileChange = (profile) => {
    setActiveProfile(profile);
    if (filterActiveBrandOnly) {
      loadConcepts(profile.client_id);
    }
  };

  const handleProfileUpdated = async (preferredClientId) => {
    const updatedProfiles = await api.getProfiles();
    setProfiles(updatedProfiles);
    if (preferredClientId) {
      const match = updatedProfiles.find((p) => p.client_id === preferredClientId);
      if (match) setActiveProfile(match);
    } else if (!activeProfile && updatedProfiles.length > 0) {
      setActiveProfile(updatedProfiles[0]);
    }
    loadConcepts(filterActiveBrandOnly && activeProfile ? activeProfile.client_id : null);
  };

  const handleConceptGenerated = (newConceptId) => {
    loadConcepts(filterActiveBrandOnly && activeProfile ? activeProfile.client_id : null);
    if (newConceptId) {
      setSelectedConceptId(newConceptId);
    }
  };

  const handleDeleteSuccess = (deletedId) => {
    setConcepts((prev) => prev.filter((c) => c.id !== deletedId));
  };

  // Schedule trigger from ConceptCard
  const handleScheduleFromCard = (concept) => {
    setScheduleModalData({
      client_id: concept.client_id,
      client_name: concept.client_name,
      concept_id: concept.id,
      platform: 'linkedin',
      title: concept.title,
      content: concept.platform_ideations?.linkedin_post || '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      status: 'scheduled',
      qa_score: concept.qa_evaluation?.total_score,
      source_formula: concept.source_formula
    });
    setIsScheduleModalOpen(true);
  };

  // Direct schedule trigger from ConceptDetailModal tabs
  const handleDirectSchedule = (postData) => {
    setScheduleModalData({
      client_id: postData.client_id,
      client_name: postData.client_name,
      concept_id: postData.concept_id,
      platform: postData.platform || 'linkedin',
      title: postData.title || '',
      content: postData.content || '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      status: 'scheduled',
      qa_score: postData.qa_score,
      source_formula: postData.source_formula
    });
    setIsScheduleModalOpen(true);
  };

  const filteredConcepts = concepts.filter((c) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(query);
      const matchFormula = c.source_formula?.toLowerCase().includes(query);
      const matchClient = c.client_name?.toLowerCase().includes(query);
      if (!matchTitle && !matchFormula && !matchClient) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Navbar */}
      <Navbar
        activeProfile={activeProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenApiKeysModal={() => setIsApiKeysModalOpen(true)}
        healthInfo={healthInfo}
        currentView={currentView}
        onNavigateLanding={() => setCurrentView('landing')}
        onNavigateApp={() => setCurrentView('app')}
        onNavigateCalendar={() => setCurrentView('calendar')}
      />

      {currentView === 'landing' ? (
        <LandingPage
          onLaunchApp={() => setCurrentView('app')}
          onOpenApiKeysModal={() => setIsApiKeysModalOpen(true)}
          activeProfile={activeProfile}
        />
      ) : currentView === 'calendar' ? (
        /* Content Calendar View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <ContentCalendar
            activeProfile={activeProfile}
            profiles={profiles}
            filterActiveBrandOnly={filterActiveBrandOnly}
            onToggleFilterActiveBrand={() => setFilterActiveBrandOnly(!filterActiveBrandOnly)}
          />
        </main>
      ) : (
        /* Main Workspace Container (Ingestion + Adapted Concepts Library) */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero & Ingestion Section */}
          <div className="space-y-4">
            <IngestionBar
              activeProfile={activeProfile}
              onConceptGenerated={handleConceptGenerated}
            />
          </div>

          {/* Content Library Section */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Adapted Content Library</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 font-mono">
                    {filteredConcepts.length} concepts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Viral narrative patterns adapted into high-authority drafts with zero emojis and real numbers.
                </p>
              </div>

              {/* Controls: Search, Brand Filter, & View Calendar Shortcut */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Open Calendar</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search concepts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
                  />
                </div>

                <button
                  onClick={() => {
                    const nextFilter = !filterActiveBrandOnly;
                    setFilterActiveBrandOnly(nextFilter);
                    loadConcepts(nextFilter && activeProfile ? activeProfile.client_id : null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    filterActiveBrandOnly
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filterActiveBrandOnly ? 'Active Brand Only' : 'All Brands'}</span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div className="py-24 text-center text-slate-500 text-sm">Loading library...</div>
            ) : filteredConcepts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredConcepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    onSelect={(id) => setSelectedConceptId(id)}
                    onDeleteSuccess={handleDeleteSuccess}
                    onSchedule={handleScheduleFromCard}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-300">No adapted concepts yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Paste a LinkedIn, YouTube, Instagram, or TikTok URL above (or upload a video) to trigger autonomous reverse-engineering.
                </p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 mt-16 text-center text-xs text-slate-600">
        <p>ContentEngine • Autonomous Brand Adaptation Engine • Powered by Gemini Flash & Groq Whisper</p>
      </footer>

      {/* Modals */}
      <ApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        onKeysUpdated={loadInitialData}
      />

      <ProfileSwitcher
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={handleProfileChange}
        onProfileUpdated={handleProfileUpdated}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ConceptDetailModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
        onSchedulePost={handleDirectSchedule}
      />

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleModalData(null);
        }}
        initialData={scheduleModalData}
        activeProfile={activeProfile}
        profiles={profiles}
        onSaved={() => {
          // If we are currently in workspace, offer a smooth transition or notification
        }}
      />
    </div>
  );
}
