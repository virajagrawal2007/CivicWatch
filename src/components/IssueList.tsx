import { useState } from 'react';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { CATEGORY_METADATA } from '../utils/mapData';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckSquare, 
  MessageSquare, 
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue: (issue: Issue) => void;
  onReportClick: () => void;
}

export default function IssueList({ issues, selectedIssueId, onSelectIssue, onReportClick }: IssueListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'gravity' | 'validations'>('newest');

  // Filter & Search Logic
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.locationName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesNeighborhood = selectedNeighborhood === 'all' || issue.neighborhood === selectedNeighborhood;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesNeighborhood && matchesStatus;
  });

  // Sort Logic
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'gravity') {
      return b.gravityScore - a.gravityScore;
    } else if (sortBy === 'validations') {
      return b.validations.length - a.validations.length;
    }
    return 0;
  });

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'reported':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'validated':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
    }
  };

  const getGravityBadge = (score: number) => {
    if (score >= 8) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
    } else if (score >= 5) {
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    } else {
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-750';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Hub */}
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 shadow-xs space-y-3.5">
        
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            id="issue-search-input"
            type="text"
            placeholder="Search by keywords, street address, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="broken_roads">Broken Roads</option>
              <option value="open_potholes">Open Potholes</option>
              <option value="electricity_poles">Electricity Issues</option>
              <option value="sanitation">Sanitation</option>
            </select>
          </div>

          {/* Neighborhood Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neighborhood</label>
            <select
              id="neighborhood-filter-select"
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Neighborhoods</option>
              <option value="Central Delhi">Central Delhi</option>
              <option value="North Delhi">North Delhi</option>
              <option value="East Delhi">East Delhi</option>
              <option value="South Delhi">South Delhi</option>
              <option value="West Delhi">West Delhi</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              id="status-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="validated">Community Verified</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="newest">Newest Logged</option>
              <option value="gravity">Highest Severity</option>
              <option value="validations">Most Validations</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid count and status */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-700 dark:text-slate-300">{sortedIssues.length}</span> matching reports
        </p>
        {sortedIssues.length === 0 && (
          <button 
            id="report-issue-inline-btn"
            onClick={onReportClick} 
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            Report one now
          </button>
        )}
      </div>

      {/* Issues Grid */}
      {sortedIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedIssues.map((issue) => {
            const meta = CATEGORY_METADATA[issue.category];
            const isSelected = selectedIssueId === issue.id;
            const daysAgo = Math.round(
              (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={issue.id}
                id={`issue-card-${issue.id}`}
                onClick={() => onSelectIssue(issue)}
                className={`bg-white dark:bg-slate-950 border rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isSelected 
                    ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                    : 'border-slate-150 dark:border-slate-850'
                }`}
              >
                <div>
                  {/* Photo or Placeholder Banner */}
                  <div className="relative h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <img
                      src={issue.photoUrl}
                      alt={issue.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent"></div>
                    
                    {/* Top Pill badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs uppercase tracking-wider ${getStatusBadge(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs flex items-center gap-1 uppercase tracking-wider ${getGravityBadge(issue.gravityScore)}`}>
                        <AlertTriangle className="w-3 h-3" /> Severity {issue.gravityScore}/10
                      </span>
                    </div>

                    {/* Neighborhood Title overlays */}
                    <div className="absolute bottom-2 left-3 text-white">
                      <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {issue.neighborhood}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: `var(--color-${meta?.color})` }}>
                      <span className={`px-2 py-0.5 rounded-md ${meta?.badgeBg}`}>
                        {meta?.label}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-1">
                      {issue.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title={`${issue.validations.length} citizens verified this issue`}>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <strong className="text-slate-600 dark:text-slate-300">{issue.validations.length}</strong> verifications
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-600 dark:text-slate-300">{issue.comments.length}</strong> comments
                    </span>
                  </div>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-slate-300 animate-pulse" />
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No community issues matching filters found</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Try resetting your active search text or categoric select bars, or file a brand-new community report.
          </p>
          <button
            id="report-issue-large-btn"
            onClick={onReportClick}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            File Community Report
          </button>
        </div>
      )}
    </div>
  );
}
