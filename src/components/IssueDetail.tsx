import React, { useState } from 'react';
import { Issue, Comment, IssueStatus } from '../types';
import { CATEGORY_METADATA } from '../utils/mapData';
import { 
  MapPin, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Copy, 
  MessageSquare, 
  Plus, 
  Send, 
  Bookmark, 
  ShieldAlert, 
  Wrench, 
  Sparkles,
  ArrowLeft,
  Activity
} from 'lucide-react';

interface IssueDetailProps {
  issue: Issue;
  currentUser: { name: string; email: string };
  onBack: () => void;
  onValidate: (issueId: string, email: string) => Promise<void>;
  onFlag: (issueId: string, email: string) => Promise<void>;
  onAddComment: (issueId: string, userName: string, userEmail: string, text: string) => Promise<void>;
  onUpdateStatus: (issueId: string, status: IssueStatus, resolutionNotes: string, updatedBy: string) => Promise<void>;
}

export default function IssueDetail({
  issue,
  currentUser,
  onBack,
  onValidate,
  onFlag,
  onAddComment,
  onUpdateStatus
}: IssueDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<IssueStatus>(issue.status);
  const [copied, setCopied] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const meta = CATEGORY_METADATA[issue.category];

  // Clipboard copy helper
  const handleCopyLetter = () => {
    navigator.clipboard.writeText(issue.officialRequestDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Upvote / Validate helper
  const handleValidateClick = async () => {
    if (issue.validations.includes(currentUser.email)) return;
    setIsVoting(true);
    try {
      await onValidate(issue.id, currentUser.email);
    } catch (err) {
      alert("Validation failed or already recorded.");
    } finally {
      setIsVoting(false);
    }
  };

  // Flag duplicate/spam
  const handleFlagClick = async () => {
    if (issue.flags.includes(currentUser.email)) return;
    if (confirm("Are you sure you want to flag this issue as a duplicate or spam?")) {
      await onFlag(issue.id, currentUser.email);
    }
  };

  // Comment submit helper
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await onAddComment(issue.id, currentUser.name, currentUser.email, newComment);
      setNewComment('');
    } catch (err) {
      alert("Could not post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Status simulation update helper
  const handleSimulatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(
        issue.id, 
        simulationStatus, 
        simulationStatus === 'resolved' ? resolutionNotes : '', 
        currentUser.name
      );
      setResolutionNotes('');
    } catch (err) {
      alert("Could not update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'reported': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40';
      case 'validated': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40';
      case 'in_progress': return 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 animate-pulse';
      case 'resolved': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40';
    }
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Detail Header & Back button */}
      <div className="flex items-center gap-3">
        <button
          id="detail-back-btn"
          onClick={onBack}
          className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Report Details</span>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>#{issue.id.split('_')[1] || issue.id}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 dark:text-slate-400 font-medium text-xs truncate max-w-[200px] sm:max-w-none">{issue.locationName}</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Issue Info, Photo, Community Actions, Discussion */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Main Info card */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
            <div className="relative h-64 bg-slate-100 dark:bg-slate-900">
              <img
                src={issue.photoUrl}
                alt={issue.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  let fallback = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600";
                  if (issue.category === 'electricity_poles') {
                    fallback = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600";
                  } else if (issue.category === 'sanitation') {
                    fallback = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600";
                  } else if (issue.category === 'broken_roads') {
                    fallback = "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600";
                  }
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 to-transparent"></div>
              
              {/* Category tag */}
              <div className="absolute top-4 left-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border uppercase tracking-wider backdrop-blur-xs shadow-xs ${getStatusColor(issue.status)}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: `var(--color-${meta?.color})` }}>
                  <span className={`px-2.5 py-1 rounded-md ${meta?.badgeBg}`}>
                    {meta?.label}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 normal-case font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {issue.neighborhood}
                  </span>
                </div>

                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {issue.title}
                </h1>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {issue.description}
                </p>
              </div>

              {/* Metadata log footer */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-medium">Reported By</span>
                  <p className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {issue.reporterName}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block font-medium">Date Filed</span>
                  <p className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block font-medium">Coordinate Index</span>
                  <p className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Grid: [{issue.longitude}%, {issue.latitude}%]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Community Council Verification Widget */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Citizen Validation Council
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                We use community crowd-sourced verifications to bypass mock infrastructure. Issues require <strong>3 validations</strong> to establish priority status.
              </p>
            </div>

            {/* Validation status meter */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Verification Progress</span>
                <span className="text-slate-800 dark:text-slate-100">{issue.validations.length} / 3 Validations</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-350 ${
                    issue.status === 'reported' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((issue.validations.length / 3) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">
                {issue.status === 'reported' 
                  ? `Requires ${Math.max(3 - issue.validations.length, 1)} more citizen vote(s) to transition to 'Community Verified'.` 
                  : `Successfully verified as a core neighborhood priority.`}
              </p>

              {issue.validations.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-900 mt-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Verification Register</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {issue.validations.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-350 bg-slate-100/50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-150/30 dark:border-slate-800/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{email.split('@')[0].replace('.', ' ')}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({email})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification buttons */}
            <div className="flex items-center gap-3">
              {issue.validations.includes(currentUser.email) ? (
                <div className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-center rounded-xl text-xs font-semibold">
                  ✓ You have verified this issue
                </div>
              ) : (
                <button
                  id="validate-issue-btn"
                  onClick={handleValidateClick}
                  disabled={isVoting || issue.status === 'resolved'}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Validate Concern
                </button>
              )}

              {!issue.flags.includes(currentUser.email) && issue.status !== 'resolved' && (
                <button
                  id="flag-issue-btn"
                  onClick={handleFlagClick}
                  className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-red-500 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  title="Flag as duplicate or fake"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Discussion Forums (Comments) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Citizen Coordination Forum ({issue.comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                id="comment-input"
                type="text"
                placeholder="Share an update, duplicate links, or coordination notes..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <button
                id="submit-comment-btn"
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer disabled:bg-slate-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Comments list */}
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {issue.comments.length > 0 ? (
                issue.comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <User className="w-3 h-3" /> {c.userName}
                      </span>
                      <span>{formatTimestamp(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed leading-snug">
                      {c.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No discussion comments posted yet. Be the first to coordinate!
                </p>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Automation Blueprint, Audit Timeline, Municipal Simulator */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Gemini AI Analysis blueprint */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-4.5 h-4.5" />
                <h3 className="font-bold text-sm tracking-tight text-indigo-300">Intelligent AI Analysis</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase tracking-wider">
                Gemini 3.5 Active
              </span>
            </div>

            {/* Gravity card */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-bold text-lg flex items-center justify-center w-12 h-12 flex-shrink-0">
                {issue.gravityScore}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gravity Hazard Rating</span>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {issue.gravityJustification}
                </p>
              </div>
            </div>

            {/* Action plan */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Contractor Action Plan
              </span>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                {issue.actionSteps.map((step, idx) => (
                  <p key={idx} className="text-slate-350 leading-relaxed border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                    {step}
                  </p>
                ))}
              </div>
            </div>

            {/* Copiable Letter draft */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Official Request Draft
                </span>
                <button
                  id="copy-letter-btn"
                  onClick={handleCopyLetter}
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 overflow-y-auto max-h-48 whitespace-pre-line leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {issue.officialRequestDraft}
              </div>
            </div>
          </div>

          {/* 2. Municipal Simulation Console (Simulates Back-Office update) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Wrench className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Municipal Action Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate a City Official, Contractor, or Inspector updating the issue or completing the repair.
              </p>
            </div>

            <form onSubmit={handleSimulatorSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {['reported', 'validated', 'in_progress', 'resolved'].map((st) => (
                  <button
                    key={st}
                    id={`sim-status-btn-${st}`}
                    type="button"
                    onClick={() => setSimulationStatus(st as IssueStatus)}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                      simulationStatus === st
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {simulationStatus === 'resolved' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution Audit Notes</label>
                  <textarea
                    id="sim-notes-input"
                    rows={2}
                    placeholder="Provide details on concrete repair, contractor swap, and inspection complete..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              <button
                id="sim-submit-btn"
                type="submit"
                disabled={isUpdatingStatus || (simulationStatus === issue.status && simulationStatus !== 'resolved')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs disabled:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                Update Dispatch Records
              </button>
            </form>
          </div>

          {/* 3. Status Audit Timeline */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Transparency Audit Logs
            </h3>

            <div className="relative border-l-2 border-slate-100 dark:border-slate-850 pl-4 ml-2.5 space-y-5">
              {issue.timeline.map((evt) => (
                <div key={evt.id} id={`timeline-evt-${evt.id}`} className="relative space-y-0.5">
                  {/* Bullet */}
                  <span className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-950 ${
                    evt.status === 'resolved' ? 'bg-emerald-500' : evt.status === 'in_progress' ? 'bg-purple-500' : 'bg-slate-300'
                  }`} />
                  
                  <div className="flex justify-between items-start text-xs font-bold text-slate-700 dark:text-slate-300">
                    <p>{evt.title}</p>
                    <span className="text-[9px] font-medium text-slate-400">{formatTimestamp(evt.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {evt.description}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    Logged by: {evt.updatedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
