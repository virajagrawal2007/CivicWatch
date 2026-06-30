import { useState, useEffect } from 'react';
import { LeaderboardUser } from '../types';
import { Users, Award, Shield, Trophy, CheckSquare, MessageSquare, Sparkles, Eye, EyeOff } from 'lucide-react';

interface LeaderboardProps {
  currentUser?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Leaderboard({ currentUser }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMyName, setShowMyName] = useState(true);
  const [updatingPref, setUpdatingPref] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    if (currentUser) {
      fetchUserPreference();
    }
  }, [currentUser]);

  const fetchLeaderboard = async () => {
    try {
      const url = currentUser 
        ? `/api/leaderboard?email=${encodeURIComponent(currentUser.email)}&role=${encodeURIComponent(currentUser.role)}`
        : '/api/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Could not fetch leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreference = async () => {
    try {
      const res = await fetch(`/api/user-preferences?email=${encodeURIComponent(currentUser!.email)}`);
      const data = await res.json();
      if (data && typeof data.showName === 'boolean') {
        setShowMyName(data.showName);
      }
    } catch (err) {
      console.error("Could not fetch user preference", err);
    }
  };

  const handleTogglePreference = async () => {
    if (!currentUser) return;
    setUpdatingPref(true);
    try {
      const nextVal = !showMyName;
      const res = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          showName: nextVal
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setShowMyName(nextVal);
        // Instantly refresh the list to show the new anonymous name/obfuscated email
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Could not update user preference", err);
    } finally {
      setUpdatingPref(false);
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Civic Guardian':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'Community Leader':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'Active Patriot':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />;
    if (idx === 1) return <Award className="w-5 h-5 text-slate-400" />;
    if (idx === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-400 font-bold text-xs">#{idx + 1}</span>;
  };

  const myEntry = users.find(u => u.isMe);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Rules callout card */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-950 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="text-base font-bold flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Community Contribution Leaderboard
          </h2>
          <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
            Citizens earn contribution credits to help catalog and verify local problems: <strong>15 points</strong> per reported incident, <strong>5 points</strong> per council verification, and <strong>3 points</strong> per helpful coordination comment.
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-300 block">Total Active Contributors</span>
          <span className="text-xl font-bold">{loading ? "..." : users.length} citizens</span>
        </div>
      </div>

      {/* Personal Credits Hub */}
      {currentUser && myEntry && (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-900/20 dark:to-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Civic Credit Balances</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lifetime Score */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-850 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Contribution Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{myEntry.score}</span>
                <span className="text-xs text-slate-450 font-semibold">pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">Determines your rank on the leaderboard (never reduces when spending)</p>
            </div>

            {/* Spent Points */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-850 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Spent / Redeemed Credits</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-500 dark:text-slate-450">{myEntry.spentPoints}</span>
                <span className="text-xs text-slate-450 font-semibold">pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">Points successfully exchanged for municipal vouchers</p>
            </div>

            {/* Wallet Balance */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-950 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 block">Available Wallet Balance</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300">{myEntry.walletBalance}</span>
                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">pts</span>
              </div>
              <p className="text-[10px] text-indigo-500 dark:text-indigo-300 mt-1 leading-snug font-medium">Available to spend in the Vouchers shop right now</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Card */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl mt-0.5 ${
              showMyName 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
            }`}>
              {showMyName ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Leaderboard Identity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                As <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.name} ({currentUser.email})</span>, 
                your current setting is: {showMyName ? (
                  <strong className="text-indigo-600 dark:text-indigo-400">Public Name and Email</strong>
                ) : (
                  <strong className="text-slate-700 dark:text-slate-300">Anonymous Citizen</strong>
                )}. You can toggle this anytime.
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-leaderboard-privacy"
            onClick={handleTogglePreference}
            disabled={updatingPref}
            className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-w-[150px] ${
              showMyName 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            } disabled:opacity-50`}
          >
            {updatingPref ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : showMyName ? (
              <><EyeOff className="w-4 h-4" /> Keep Me Anonymous</>
            ) : (
              <><Eye className="w-4 h-4" /> Show My Real Name</>
            )}
          </button>
        </div>
      )}

      {/* Main Contributors table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Compiling citizen contribution logs...
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Contributor</th>
                  <th className="py-3.5 px-4">Reported</th>
                  <th className="py-3.5 px-4">Validations</th>
                  <th className="py-3.5 px-4">Comments</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Score</th>
                  {currentUser?.role === 'head' && (
                    <th className="py-3.5 px-4 text-right">Wallet Balance</th>
                  )}
                  <th className="py-3.5 px-4 text-right pr-6">Civic Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {users.map((user, idx) => {
                  return (
                    <tr 
                      key={user.email} 
                      id={`leaderboard-tr-${user.email.replace(/[@.]/g, '-')}`}
                      className={`transition-colors ${
                        user.isMe 
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/35 font-medium' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(idx)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                            {user.name}
                            {user.visibleToAdminOnly && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded-sm font-semibold tracking-wide border border-amber-200 dark:border-amber-900/30">
                                <EyeOff className="w-2.5 h-2.5" /> Anonymous (Admin Visible)
                              </span>
                            )}
                            {user.isMe && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          {user.reportsCount} reports
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                          {user.validationsCount} verified
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          {user.commentsCount} comments
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                        {user.score} pts
                      </td>
                      {currentUser?.role === 'head' && (
                        <td className="py-4 px-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                          {user.walletBalance} pts
                        </td>
                      )}
                      <td className="py-4 px-4 text-right pr-6">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize ${getBadgeStyle(user.badge)}`}>
                          {user.badge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
            <p>No active contributor credits compiled yet.</p>
            <p className="text-[10px]">Start reporting or verifying issues to claim your spot!</p>
          </div>
        )}
      </div>

    </div>
  );
}
