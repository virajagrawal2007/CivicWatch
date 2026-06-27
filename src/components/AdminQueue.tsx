import React, { useState } from 'react';
import { Issue, IssueStatus } from '../types';
import { 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  TrendingUp, 
  Filter, 
  Check, 
  MessageSquare,
  ArrowRight,
  UserCheck,
  Zap,
  CheckSquare
} from 'lucide-react';

interface AdminQueueProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, status: IssueStatus, resolutionNotes: string, updatedBy: string) => Promise<void>;
  onSelectIssue: (issue: Issue) => void;
  currentUser: { name: string; email: string; role: string };
}

export default function AdminQueue({ issues, onUpdateStatus, onSelectIssue, currentUser }: AdminQueueProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'criticality' | 'gravity' | 'validations' | 'oldest'>('criticality');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dispatching, setDispatching] = useState<Record<string, boolean>>({});

  // Filter out resolved issues for the repair queue
  const activeIssues = issues.filter(issue => issue.status !== 'resolved');

  // Helper to calculate criticality score (0-100)
  const calculateCriticality = (issue: Issue) => {
    // Gravity is 1-10 (max 70 points)
    const gravityPoints = (issue.gravityScore || 5) * 7;
    // Each validation adds 5 points (max 30 points)
    const validationPoints = Math.min((issue.validations?.length || 0) * 5, 30);
    return Math.min(gravityPoints + validationPoints, 100);
  };

  // Map Category to human readable label
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'broken_roads': return 'Broken Road';
      case 'open_potholes': return 'Open Pothole';
      case 'electricity_poles': return 'Electricity Pole';
      case 'sanitation': return 'Sanitation';
      default: return cat;
    }
  };

  // Sort queue
  const sortedIssues = [...activeIssues]
    .filter(issue => filterCategory === 'all' || issue.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'criticality') {
        return calculateCriticality(b) - calculateCriticality(a);
      }
      if (sortBy === 'gravity') {
        return (b.gravityScore || 0) - (a.gravityScore || 0);
      }
      if (sortBy === 'validations') {
        return (b.validations?.length || 0) - (a.validations?.length || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

  // Criticality styling helper
  const getCriticalityBadge = (score: number) => {
    if (score >= 75) {
      return {
        label: 'CRITICAL',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/45 dark:text-rose-400 dark:border-rose-900/50',
        barColor: 'bg-rose-500 animate-pulse'
      };
    }
    if (score >= 50) {
      return {
        label: 'HIGH',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/45 dark:text-amber-400 dark:border-amber-900/50',
        barColor: 'bg-amber-500'
      };
    }
    if (score >= 25) {
      return {
        label: 'MEDIUM',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/45 dark:text-yellow-400 dark:border-yellow-900/50',
        barColor: 'bg-yellow-500'
      };
    }
    return {
      label: 'LOW',
      color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
      barColor: 'bg-slate-400'
    };
  };

  const handleDispatch = async (issueId: string) => {
    setDispatching(prev => ({ ...prev, [issueId]: true }));
    const resolutionNote = notes[issueId]?.trim() || "Municipal Rapid Response unit dispatched on authority of the Municipal Head.";
    
    // Simulate active dispatching with status change to "in_progress"
    await onUpdateStatus(issueId, 'in_progress', resolutionNote, currentUser.name);
    
    setNotes(prev => ({ ...prev, [issueId]: '' }));
    setDispatching(prev => ({ ...prev, [issueId]: false }));
  };

  const handleResolveDirect = async (issueId: string) => {
    setDispatching(prev => ({ ...prev, [issueId]: true }));
    const resolutionNote = notes[issueId]?.trim() || "Completed priority emergency repairs. Final post-resolution inspection passed.";
    
    await onUpdateStatus(issueId, 'resolved', resolutionNote, currentUser.name);
    
    setNotes(prev => ({ ...prev, [issueId]: '' }));
    setDispatching(prev => ({ ...prev, [issueId]: false }));
  };

  // Math stats for admin widgets
  const totalCriticalCount = activeIssues.filter(i => calculateCriticality(i) >= 75).length;
  const avgSeverity = activeIssues.length > 0 
    ? (activeIssues.reduce((acc, curr) => acc + (curr.gravityScore || 5), 0) / activeIssues.length).toFixed(1) 
    : '0';
  const dispatchedCount = activeIssues.filter(i => i.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-850 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/30">
              Restricted Portal
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live Authorization Active
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Municipal Head Control Center</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Authorized administrative workspace for <strong>{currentUser.name}</strong>. Here, crowdsourced resident validations and Gemini AI severity indexes compile into a live, mathematically ranked repair queue. Use status overrides to dispatch engineers instantly.
          </p>
        </div>
      </div>

      {/* 2. Micro Executive KPI Summary widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Pending Critical Issues</p>
            <h4 className="text-2xl font-black text-rose-600 dark:text-rose-500">{totalCriticalCount}</h4>
            <p className="text-[10px] text-slate-400">Criticality index &gt;= 75%</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Queue Severity</p>
            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-500">{avgSeverity} <span className="text-xs text-slate-400 font-normal">/ 10</span></h4>
            <p className="text-[10px] text-slate-400">Gemini severity assessment</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Crew Dispatches</p>
            <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dispatchedCount}</h4>
            <p className="text-[10px] text-slate-400">Incidents currently 'In Progress'</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Controls & Queue Feed Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* Sorting and Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
              Priority Repair Queue ({sortedIssues.length} active)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ranked dynamically by compounding: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-[10px] text-indigo-600 dark:text-indigo-400">Criticality = (Gravity * 7) + (Validations * 5)</code>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="admin-category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-600 dark:text-slate-350 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="broken_roads">Broken Roads</option>
                <option value="open_potholes">Open Potholes</option>
                <option value="electricity_poles">Electricity Poles</option>
                <option value="sanitation">Sanitation</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">
              <span className="text-xs text-slate-400">Sort by:</span>
              <select
                id="admin-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="criticality">Criticality Score</option>
                <option value="gravity">Gemini Severity</option>
                <option value="validations">Citizen Votes</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Repair Queue */}
        <div className="space-y-4">
          {sortedIssues.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 animate-bounce" />
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Zero Pending Active Complaints</h4>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                No active complaints match your current filters. The city is fully maintained and compliant!
              </p>
            </div>
          ) : (
            sortedIssues.map((issue, index) => {
              const score = calculateCriticality(issue);
              const badge = getCriticalityBadge(score);

              return (
                <div 
                  key={issue.id} 
                  id={`queue-card-${issue.id}`}
                  className="group relative bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-slate-150 dark:border-slate-850 hover:border-indigo-100 dark:hover:border-indigo-950/40 rounded-xl p-5 transition-all duration-200 flex flex-col lg:flex-row gap-5"
                >
                  
                  {/* Left priority index indicator */}
                  <div className="flex lg:flex-col items-center justify-between lg:justify-center border-b lg:border-b-0 lg:border-r border-slate-200/50 dark:border-slate-800 pb-3 lg:pb-0 lg:pr-5 min-w-[70px]">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block lg:mb-1">Rank</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">#{index + 1}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badge.color} mt-1 block`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Middle section: Issue detail */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          {getCategoryLabel(issue.category)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-800">•</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Filed {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-slate-300 dark:text-slate-800">•</span>
                        <span className="text-[11px] text-slate-400 font-medium">District: {issue.neighborhood}</span>
                      </div>
                      <h4 
                        onClick={() => onSelectIssue(issue)}
                        className="font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-indigo-600 cursor-pointer mt-1 hover:underline"
                      >
                        {issue.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    {/* Score Compound Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Criticality Index ({score}%)</span>
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span>Gravity Score: <strong>{issue.gravityScore || 5}/10</strong></span>
                          <span>•</span>
                          <span>Votes: <strong>{issue.validations?.length || 0}</strong></span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${badge.barColor}`} style={{ width: `${score}%` }}></div>
                      </div>
                    </div>

                    {/* Gemini Action plan snapshot */}
                    {issue.actionSteps && issue.actionSteps.length > 0 && (
                      <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1.5">
                        <span className="text-[9px] text-indigo-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 animate-spin" /> Next AI-Suggested Priority Resolution Step
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal font-medium">
                          {issue.actionSteps[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right side: Action Station */}
                  <div className="lg:w-64 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200/50 dark:border-slate-800 pt-3 lg:pt-0 lg:pl-5 space-y-3">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Status Command Station</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          issue.status === 'reported' ? 'bg-slate-100 dark:bg-slate-900 text-slate-500' :
                          issue.status === 'validated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {issue.status.toUpperCase().replace('_', ' ')}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400 font-medium">Authorize dispatch:</span>
                      </div>
                    </div>

                    {/* Action form & notes */}
                    <div className="space-y-2">
                      <input 
                        id={`dispatch-note-${issue.id}`}
                        type="text" 
                        placeholder="Optional resolution instructions..." 
                        value={notes[issue.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [issue.id]: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                      />
                      
                      <div className="flex gap-2">
                        {issue.status !== 'in_progress' && (
                          <button
                            id={`dispatch-btn-${issue.id}`}
                            onClick={() => handleDispatch(issue.id)}
                            disabled={dispatching[issue.id]}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5" /> Dispatch
                          </button>
                        )}
                        <button
                          id={`resolve-btn-${issue.id}`}
                          onClick={() => handleResolveDirect(issue.id)}
                          disabled={dispatching[issue.id]}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
