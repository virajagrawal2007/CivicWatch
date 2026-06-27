import { CivicStats, IssueCategory } from '../types';
import { CATEGORY_METADATA } from '../utils/mapData';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Building2, 
  Activity, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertTriangle, 
  Hourglass, 
  Sparkles,
  Users
} from 'lucide-react';

interface DashboardProps {
  stats: CivicStats;
  onNavigateToIssues?: () => void;
  onNavigateToLeaderboard?: () => void;
}

export default function Dashboard({ stats, onNavigateToIssues, onNavigateToLeaderboard }: DashboardProps) {
  // Reformat category distribution for Recharts
  const categoryData = Object.entries(stats.categoryDistribution).map(([key, value]) => {
    const meta = CATEGORY_METADATA[key as IssueCategory];
    return {
      name: meta?.label || key,
      value: value,
      color: key === 'open_potholes' ? '#ef4444' : key === 'broken_roads' ? '#f59e0b' : key === 'electricity_poles' ? '#eab308' : '#0d9488'
    };
  });

  // Reformat status distribution for Recharts
  const statusData = [
    { name: 'Reported', value: stats.statusDistribution.reported, color: '#f59e0b' },
    { name: 'Validated', value: stats.statusDistribution.validated, color: '#3b82f6' },
    { name: 'In Progress', value: stats.statusDistribution.in_progress, color: '#a855f7' },
    { name: 'Resolved', value: stats.statusDistribution.resolved, color: '#10b981' }
  ].filter(s => s.value > 0);

  // Reformat neighborhood data
  const neighborhoodData = Object.entries(stats.neighborhoodDistribution).map(([name, count]) => ({
    name: name.split(' ')[0], // short name
    fullName: name,
    count
  })).sort((a, b) => b.count - a.count);

  const cardStatStyle = "bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5";

  // Calculate percentages
  const resolutionRate = stats.totalIssues > 0 
    ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardStatStyle}>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Complaints</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.activeIssues}</h4>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5" /> Pending resolution
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className={cardStatStyle}>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Resolved Issues</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.resolvedIssues}</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {resolutionRate}% Clear Rate
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className={cardStatStyle}>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Citizen Verifications</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.validationCount}</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Democratic validation
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className={cardStatStyle}>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Resolution Time</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.averageResolutionDays} days</h4>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Optimizing dispatch
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Distribution Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Issue Distribution by Category</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quantity of verified and reported concerns currently tracked.</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    color: 'white', 
                    border: 'none',
                    fontSize: '11px'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Circle Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Resolution Status Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Proportion of issues in various stages of municipal completion.</p>
          </div>

          <div className="h-44 my-2 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '8px', 
                      color: 'white', 
                      border: 'none',
                      fontSize: '11px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No issues reported yet to map.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-medium text-slate-600 dark:text-slate-300">{entry.name}:</span>
                <span className="font-bold ml-auto text-slate-800 dark:text-slate-100">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neighborhood and Civic Callouts section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Neighborhood Distribution list */}
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">Civic Concerns by Neighborhood</h3>
          <p className="text-xs text-slate-400 mb-4">Tracking geographic clusters to guide planning.</p>
          
          <div className="space-y-3.5">
            {neighborhoodData.length > 0 ? (
              neighborhoodData.map((nh, index) => {
                const maxCount = Math.max(...neighborhoodData.map(n => n.count));
                const pct = maxCount > 0 ? (nh.count / maxCount) * 100 : 0;
                return (
                  <div key={nh.fullName} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{nh.fullName}</span>
                      <span className="text-slate-800 dark:text-slate-100 font-bold">{nh.count} reported</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-indigo-600' : index === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No neighborhood data compiled yet.</p>
            )}
          </div>
        </div>

        {/* Transparency Commitment & Civic Hero Guide */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Automation Active
            </div>
            <h4 className="text-lg font-bold tracking-tight">Our Transparency Commitment</h4>
            <p className="text-xs text-indigo-150 leading-relaxed">
              CivicWatch bridges the gap between citizens and city officials. Every issue reported undergoes automated AI analysis powered by <strong>Gemini 3.5 Flash</strong> to determine its immediate safety hazard, construct standard municipal repair instructions, and draft formal request letters.
            </p>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-indigo-200">
              <span className="font-bold block text-white">Join the Civic Council</span>
              Verify open reports in your district to earn score points.
            </div>
            <div className="flex gap-2">
              <button 
                id="dashboard-explore-btn"
                onClick={onNavigateToIssues} 
                className="px-3.5 py-1.5 bg-white text-indigo-900 font-semibold rounded-lg text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Review Issues
              </button>
              <button 
                id="dashboard-leaderboard-btn"
                onClick={onNavigateToLeaderboard} 
                className="px-3.5 py-1.5 bg-white/10 text-white font-semibold rounded-lg text-xs hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
