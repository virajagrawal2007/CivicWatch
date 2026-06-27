import { useState, useEffect } from 'react';
import { LeaderboardUser } from '../types';
import { Users, Award, Shield, Trophy, Activity, MessageSquare, CheckSquare, Sparkles } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Could not fetch leaderboard", err);
    } finally {
      setLoading(false);
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
        return 'bg-slate-100 text-slate-600 border-slate-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750';
    }
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />;
    if (idx === 1) return <Award className="w-5 h-5 text-slate-400" />;
    if (idx === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-400 font-bold text-xs">#{idx + 1}</span>;
  };

  return (
    <div className="space-y-6">
      
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
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4">Validations</th>
                  <th className="py-3 px-4">Comments</th>
                  <th className="py-3 px-4 text-right">Score Credits</th>
                  <th className="py-3 px-4 text-right">Civic Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {users.map((user, idx) => {
                  return (
                    <tr 
                      key={user.email} 
                      id={`leaderboard-tr-${user.email.replace(/[@.]/g, '-')}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(idx)}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        <div>
                          <p>{user.name}</p>
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
                      <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-indigo-400">
                        {user.score} pts
                      </td>
                      <td className="py-4 px-4 text-right">
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
