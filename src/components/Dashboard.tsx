import { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus, WorkEnvironment } from '../types';
import { JobCard } from './JobCard';
import { EmptyState } from './EmptyState';
import { StorageService } from '../services/storage';

interface DashboardProps {
  jobs: JobApplication[];
  onJobClick: (job: JobApplication) => void;
  onAddJob: () => void;
  onJobUpdate?: () => void;
}

type SortField = 'date' | 'company' | 'title' | 'status';
type SortOrder = 'asc' | 'desc';

export const Dashboard = ({ jobs, onJobClick, onAddJob, onJobUpdate }: DashboardProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWorkEnv, setFilterWorkEnv] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get latest status for a job
  const getLatestStatus = (job: JobApplication): ApplicationStatus => {
    if (job.statusUpdates.length > 0 && job.statusUpdates[job.statusUpdates.length - 1].nextStep) {
      return job.statusUpdates[job.statusUpdates.length - 1].nextStep!;
    }
    return ApplicationStatus.Applied;
  };

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.parsedData.title.toLowerCase().includes(query) ||
        job.parsedData.company.toLowerCase().includes(query) ||
        job.parsedData.location.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => getLatestStatus(job) === filterStatus);
    }

    // Apply work environment filter
    if (filterWorkEnv !== 'all') {
      filtered = filtered.filter(job => job.parsedData.workEnvironment === filterWorkEnv);
    }

    // Apply tag filter
    if (filterTag !== 'all') {
      filtered = filtered.filter(job =>
        job.parsedData.tags && job.parsedData.tags.includes(filterTag)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
          break;
        case 'company':
          comparison = a.parsedData.company.localeCompare(b.parsedData.company);
          break;
        case 'title':
          comparison = a.parsedData.title.localeCompare(b.parsedData.title);
          break;
        case 'status':
          comparison = getLatestStatus(a).localeCompare(getLatestStatus(b));
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [jobs, sortField, sortOrder, filterStatus, filterWorkEnv, filterTag, searchQuery]);

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Get unique statuses from jobs
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(jobs.map(job => getLatestStatus(job)));
    return Array.from(statuses).sort();
  }, [jobs]);

  // Get unique tags from jobs
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    jobs.forEach(job => {
      if (job.parsedData.tags) {
        job.parsedData.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Applications</h1>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-1">{jobs.length} total</p>
        </div>
        <div className="flex gap-2">
          {jobs.length > 0 && (
            <button
              onClick={() => StorageService.exportToCSV()}
              className="px-4 py-2 rounded-lg text-[13px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
          )}
          <button
            onClick={onAddJob}
            className="tour-add-button px-4 py-2 rounded-lg text-[13px] font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2 tour-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full px-3.5 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Work Environment Filter */}
          <div>
            <select
              value={filterWorkEnv}
              onChange={(e) => setFilterWorkEnv(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Environments</option>
              {Object.values(WorkEnvironment).map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Tags</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mr-1">Sort</span>
          {(['date', 'company', 'title', 'status'] as const).map(field => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition ${
                sortField === field
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (
                <span className="ml-0.5">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {filteredAndSortedJobs.length !== jobs.length && (
        <div className="text-[13px] text-zinc-500 dark:text-zinc-500">
          Showing {filteredAndSortedJobs.length} of {jobs.length} applications
        </div>
      )}

      {/* Job Cards Grid */}
      {filteredAndSortedJobs.length === 0 ? (
        <EmptyState
          type={jobs.length === 0 ? 'no-jobs' : 'no-results'}
          action={jobs.length === 0 ? {
            label: 'Add First Application',
            onClick: onAddJob,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAndSortedJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => onJobClick(job)}
              onUpdate={onJobUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
