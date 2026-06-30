import React, { useState, useEffect } from 'react';
import { Issue, CivicStats, IssueStatus } from './types';
import Dashboard from './components/Dashboard';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import ReportForm from './components/ReportForm';
import Leaderboard from './components/Leaderboard';
import CivicMap from './components/CivicMap';
import GoogleMapsHub from './components/GoogleMapsHub';
import AdminQueue from './components/AdminQueue';
import Vouchers from './components/Vouchers';
import { 
  Building2, 
  Map, 
  PlusCircle, 
  Award, 
  User, 
  ShieldCheck, 
  ChevronDown, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  TrafficCone,
  Eye,
  Activity,
  MapPin,
  Database,
  Lock,
  Gift
} from 'lucide-react';

// Pre-defined personas for the simulator profile switcher
const PERSONAS = [
  { name: "Sarah Jenkins (Resident)", email: "sarah.j@civic.org", role: "citizen" },
  { name: "Alex Rivera (Active Citizen)", email: "alex.rivera@civic.org", role: "citizen" },
  { name: "Commissioner Verma (Municipal Head)", email: "commissioner@citygov.org", role: "head" }
];

const LOGO_ICONS = [
  { id: 'traffic_cone', icon: TrafficCone, label: 'Road Watcher', desc: 'Alert & Safety' },
  { id: 'map_pin', icon: MapPin, label: 'Geo Tracker', desc: 'Google Maps Active' },
  { id: 'shield_check', icon: ShieldCheck, label: 'Civic Watch', desc: 'Safety Verified' },
  { id: 'eye', icon: Eye, label: 'Citizen Vision', desc: 'Crowdsourced Eyes' },
  { id: 'activity', icon: Activity, label: 'Pulse Network', desc: 'Realtime Dispatch' },
  { id: 'municipal', icon: Building2, label: 'Municipal Core', desc: 'City Administration' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'issues' | 'report' | 'leaderboard' | 'gmaps' | 'admin' | 'vouchers'>('issues');
  const [logoIconIndex, setLogoIconIndex] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [stats, setStats] = useState<CivicStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile simulation state
  const [activeUser, setActiveUser] = useState(PERSONAS[0]);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync state trigger
  const [syncTrigger, setSyncTrigger] = useState(0);

  // Filter issues based on role: citizens/residents only see their own reported issues.
  const filteredIssues = issues.filter(issue => {
    if (activeUser.role === 'citizen') {
      return issue.reporterEmail === activeUser.email;
    }
    return true;
  });

  // Load Issues and stats from Express API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [issuesRes, statsRes] = await Promise.all([
          fetch('/api/issues'),
          fetch('/api/stats')
        ]);
        const issuesData = await issuesRes.json();
        const statsData = await statsRes.json();
        setIssues(issuesData);
        setStats(statsData);

        // If an issue was currently selected, refresh its data in the detail view
        if (selectedIssue) {
          const freshIssue = issuesData.find((i: Issue) => i.id === selectedIssue.id);
          if (freshIssue) {
            setSelectedIssue(freshIssue);
          }
        }
      } catch (err) {
        console.error("Error fetching full-stack civic data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [syncTrigger]);

  const triggerSync = () => setSyncTrigger(prev => prev + 1);

  // Enforce role-based access to restricted tabs
  useEffect(() => {
    if (activeUser.role !== 'head') {
      if (activeTab === 'dashboard' || activeTab === 'admin') {
        setActiveTab('issues');
        setSelectedIssue(null);
      }
    } else {
      // Municipal heads do not need vouchers
      if (activeTab === 'vouchers') {
        setActiveTab('dashboard');
        setSelectedIssue(null);
      }
    }
  }, [activeUser, activeTab]);

  // Handle reporting creation
  const handleReportSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        triggerSync();
        setActiveTab('issues');
        setSelectedIssue(null);
      } else {
        throw new Error("Could not file report");
      }
    } catch (err) {
      console.error(err);
      alert("Submission error. Please check your connections.");
    }
  };

  // Handle citizen validation (upvote)
  const handleValidateIssue = async (issueId: string, email: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        triggerSync();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "You have already verified this issue.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle duplicate or spam flag
  const handleFlagIssue = async (issueId: string, email: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        triggerSync();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle comment submit
  const handleAddComment = async (issueId: string, userName: string, userEmail: string, text: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, userEmail, text })
      });
      if (response.ok) {
        triggerSync();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle status simulation updates
  const handleUpdateStatus = async (issueId: string, status: IssueStatus, resolutionNotes: string, updatedBy: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes, updatedBy })
      });
      if (response.ok) {
        triggerSync();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Custom simulation login helper
  const handleCustomProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && customEmail.trim()) {
      const emailLower = customEmail.toLowerCase();
      const nameLower = customName.toLowerCase();
      const isHead = emailLower.includes('head') || emailLower.includes('commissioner') || nameLower.includes('head') || nameLower.includes('commissioner');
      const isOfficial = emailLower.includes('gov') || emailLower.includes('admin') || nameLower.includes('inspector') || nameLower.includes('official');
      
      setActiveUser({
        name: customName,
        email: customEmail,
        role: isHead ? 'head' : (isOfficial ? 'official' : 'citizen')
      });
      setCustomName('');
      setCustomEmail('');
      setShowProfileMenu(false);
    }
  };

  const getActiveTabClass = (tab: typeof activeTab) => {
    return activeTab === tab 
      ? "bg-slate-900 text-white dark:bg-slate-800" 
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-350 dark:hover:bg-slate-900/60 dark:hover:text-slate-100";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* 1. Header & Dynamic Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="logo-icon-cycler"
              onClick={() => setLogoIconIndex((prev) => (prev + 1) % LOGO_ICONS.length)}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center relative group"
              title="Click to cycle platform icon"
            >
              {React.createElement(LOGO_ICONS[logoIconIndex].icon, { className: "w-5 h-5" })}
              
              {/* Tooltip to highlight the current active brand icon */}
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-[10px] text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-semibold shadow-md z-50">
                Brand: {LOGO_ICONS[logoIconIndex].label} (Click to Swap)
              </span>
            </button>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                CivicWatch
              </h1>
              <p className="text-[10px] text-slate-400 leading-none">Transparency & Resolution Platform</p>
            </div>
          </div>

          {/* Nav Tabs (Standard top layout) */}
          <div className="hidden md:flex justify-center flex-1 max-w-xl lg:max-w-2xl min-w-0">
            <nav className="flex items-center gap-0.5 lg:gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 min-w-0 overflow-x-auto no-scrollbar">
              {activeUser.role === 'head' && (
                <button
                  id="nav-tab-dashboard"
                  onClick={() => { setActiveTab('dashboard'); setSelectedIssue(null); }}
                  className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('dashboard')}`}
                >
                  Dashboard
                </button>
              )}
              {activeUser.role === 'head' && (
                <button
                  id="nav-tab-admin"
                  onClick={() => { setActiveTab('admin'); setSelectedIssue(null); }}
                  className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('admin')}`}
                >
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" /> Admin Panel
                  </span>
                </button>
              )}
              <button
                id="nav-tab-issues"
                onClick={() => { setActiveTab('issues'); }}
                className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('issues')}`}
              >
                Incident Feed
              </button>
              <button
                id="nav-tab-report"
                onClick={() => { setActiveTab('report'); setSelectedIssue(null); }}
                className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('report')}`}
              >
                Report
              </button>
              <button
                id="nav-tab-leaderboard"
                onClick={() => { setActiveTab('leaderboard'); setSelectedIssue(null); }}
                className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('leaderboard')}`}
              >
                Leaderboard
              </button>
              <button
                id="nav-tab-gmaps"
                onClick={() => { setActiveTab('gmaps'); setSelectedIssue(null); }}
                className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('gmaps')}`}
              >
                Maps
              </button>
              {activeUser.role !== 'head' && (
                <button
                  id="nav-tab-vouchers"
                  onClick={() => { setActiveTab('vouchers'); setSelectedIssue(null); }}
                  className={`px-2 py-1.5 lg:px-2.5 lg:py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${getActiveTabClass('vouchers')}`}
                >
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-emerald-500" /> Vouchers
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* SIMULATOR SWITCHER (High-fidelity testing component) */}
          <div className="flex justify-end relative flex-shrink-0">
            <button
              id="simulator-profile-toggle"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-850 text-xs text-slate-700 dark:text-slate-330 transition-colors cursor-pointer font-semibold"
            >
              <User className="w-4 h-4 text-indigo-500" />
              <span className="max-w-[120px] truncate">{activeUser.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div 
                id="simulator-profile-menu"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 space-y-4 animate-fadeIn"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Simulated Profile Switcher</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Toggle roles to test community validation (residents) vs resolving dispatch records (municipal official).
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Presets</span>
                  {PERSONAS.map((p) => (
                    <button
                      key={p.email}
                      id={`preset-user-${p.email.split('@')[0]}`}
                      onClick={() => {
                        setActiveUser(p);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        activeUser.email === p.email
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded-md">
                        {p.role}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom User Formulation */}
                <form onSubmit={handleCustomProfileSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Type Custom Identity</span>
                  <input
                    id="custom-name-input"
                    type="text"
                    required
                    placeholder="E.g. Inspector Miller"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                  <input
                    id="custom-email-input"
                    type="email"
                    required
                    placeholder="E.g. miller@citygov.org"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  />
                  <button
                    id="custom-profile-submit-btn"
                    type="submit"
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Simulate Custom Profile
                  </button>
                </form>

                {/* Developer/Inspector Quick Database View */}
                <div id="developer-db-panel" className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Developer Links</span>
                  <a
                    id="view-db-json-link"
                    href="/db.json"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer text-center"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Open db.json (Database File)
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Responsive mobile tabs list */}
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-slate-200/50 p-2 flex items-center justify-around gap-1 overflow-x-auto">
        {[
          ...(activeUser.role === 'head' ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
          ...(activeUser.role === 'head' ? [{ id: 'admin', label: 'Admin Panel' }] : []),
          { id: 'issues', label: 'Incident Feed' },
          { id: 'report', label: 'Report' },
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'gmaps', label: 'Maps' },
          ...(activeUser.role !== 'head' ? [{ id: 'vouchers', label: '🎁 Vouchers' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            id={`mob-nav-${tab.id}`}
            onClick={() => { setActiveTab(tab.id as any); setSelectedIssue(null); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Main Content Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12">
        
        {loading && issues.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">CivicWatch Core Initializing</h3>
            <p className="text-xs text-slate-400">Loading live database files and computing stats matrix...</p>
          </div>
        ) : (
          <div>
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                
                {/* Hero introduction banner */}
                <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1.5 text-center md:text-left">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start gap-2 leading-none">
                      Welcome to CivicWatch
                      <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      This dynamic full-stack platform enables citizens to identify, report, validate, and track community problems. Utilizing intelligent automated <strong>Gemini 3.5 severity analysis</strong>, we bypass mock systems to generate actionable resolution plans and copyable municipal petitions instantly.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="hero-file-report-btn"
                      onClick={() => setActiveTab('report')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> File Public Report
                    </button>
                    <button
                      id="hero-view-feed-btn"
                      onClick={() => setActiveTab('issues')}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      Explore Incidents
                    </button>
                  </div>
                </div>

                <Dashboard 
                  stats={stats} 
                  onNavigateToIssues={() => setActiveTab('issues')}
                  onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
                />
              </div>
            )}

            {/* Incident Feed Tab */}
            {activeTab === 'issues' && (
              <div>
                {selectedIssue ? (
                  <IssueDetail
                    issue={selectedIssue}
                    currentUser={activeUser}
                    onBack={() => setSelectedIssue(null)}
                    onValidate={handleValidateIssue}
                    onFlag={handleFlagIssue}
                    onAddComment={handleAddComment}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* List Section */}
                    <div className="lg:col-span-8">
                      <IssueList
                        issues={filteredIssues}
                        selectedIssueId={selectedIssue?.id}
                        onSelectIssue={(issue) => setSelectedIssue(issue)}
                        onReportClick={() => setActiveTab('report')}
                      />
                    </div>
                    {/* Floating Side Map (Operational Control Center aesthetic) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="sticky top-24">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Live Map Locator</span>
                        <CivicMap
                          issues={filteredIssues}
                          selectedIssueId={selectedIssue?.id}
                          onSelectIssue={(issue) => setSelectedIssue(issue)}
                        />
                        <div className="mt-4 p-4 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-xs space-y-2">
                          <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-indigo-500" /> Map Pinning Guidelines
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Pins displayed represent active (colored dot) and resolved (emerald dot) incidents. Hover over any municipal neighborhood district on the map to see aggregated statistics, or click any pin to instantly view detailed resolution blueprints.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Report Tab */}
            {activeTab === 'report' && (
              <ReportForm
                currentUser={activeUser}
                onSubmit={handleReportSubmit}
                onCancel={() => { setActiveTab('issues'); }}
              />
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <Leaderboard currentUser={activeUser} />
            )}

            {/* Google Maps Hub Tab */}
            {activeTab === 'gmaps' && (
              <GoogleMapsHub
                issues={issues}
                currentUser={activeUser}
                onRefreshIssues={triggerSync}
                onSelectIssue={(issue) => {
                  setSelectedIssue(issue);
                  setActiveTab('issues');
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Admin Control Tab */}
            {activeTab === 'admin' && activeUser.role === 'head' && (
              <AdminQueue
                issues={issues}
                currentUser={activeUser}
                onUpdateStatus={handleUpdateStatus}
                onSelectIssue={(issue) => {
                  setSelectedIssue(issue);
                  setActiveTab('issues');
                }}
              />
            )}

            {/* Vouchers/Rewards Tab */}
            {activeTab === 'vouchers' && (
              <Vouchers currentUser={activeUser} />
            )}

          </div>
        )}

      </main>

    </div>
  );
}
