import { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus, WorkEnvironment } from '../types';
import { JobCard } from './JobCard';
import { EmptyState } from './EmptyState';

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
  }, [jobs, sortField, sortOrder, filterStatus, filterWorkEnv, searchQuery]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-1">{jobs.length} total applications</p>
        </div>
        <button
          onClick={onAddJob}
          className="tour-add-button bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Application
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 tour-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, company, or location..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Environments</option>
              {Object.values(WorkEnvironment).map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-1 rounded text-sm ${
              sortField === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('company')}
            className={`px-3 py-1 rounded text-sm ${
              sortField === 'company' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Company {sortField === 'company' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('title')}
            className={`px-3 py-1 rounded text-sm ${
              sortField === 'title' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('status')}
            className={`px-3 py-1 rounded text-sm ${
              sortField === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Results Count */}
      {filteredAndSortedJobs.length !== jobs.length && (
        <div className="text-sm text-gray-600">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
