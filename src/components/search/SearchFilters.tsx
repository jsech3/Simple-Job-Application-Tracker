/**
 * Filter bar shared by the "Search Job Boards" and "AI Suggestions" tabs.
 *
 * Provides keyword input, location input, and dropdown filters for
 * work environment, work type, date posted, and a remote-only toggle.
 * Pressing Enter in the keyword or location fields triggers a search.
 *
 * @module SearchFilters
 */

import { JobSearchFilters, WorkEnvironment, WorkType } from '../../types';

interface SearchFiltersProps {
  /** Current filter state. */
  filters: JobSearchFilters;
  /** Called whenever any filter value changes. */
  onFiltersChange: (filters: JobSearchFilters) => void;
  /** Called when the user clicks "Search" or presses Enter. */
  onSearch: () => void;
  /** Disables the search button while a request is in flight. */
  isLoading: boolean;
}

/** Controlled filter bar for the Job Search view. */
export const SearchFilters = ({ filters, onFiltersChange, onSearch, isLoading }: SearchFiltersProps) => {
  const update = <K extends keyof JobSearchFilters>(key: K, value: JobSearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Top row: keyword + location + search button */}
        <div className="flex gap-3">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => update('query', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Job title, skills, or keywords..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="City, state, or country..."
            className="w-60 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={onSearch}
            disabled={isLoading || !filters.query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium whitespace-nowrap"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filters.workEnvironment}
            onChange={(e) => update('workEnvironment', e.target.value as WorkEnvironment | '')}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Environment</option>
            {Object.values(WorkEnvironment).filter(v => v !== WorkEnvironment.NotSpecified).map(env => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>

          <select
            value={filters.workType}
            onChange={(e) => update('workType', e.target.value as WorkType | '')}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Type</option>
            {Object.values(WorkType).filter(v => v !== WorkType.NotSpecified).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.datePosted}
            onChange={(e) => update('datePosted', e.target.value as JobSearchFilters['datePosted'])}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Any Time</option>
            <option value="today">Today</option>
            <option value="3days">Last 3 Days</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.remoteOnly}
              onChange={(e) => update('remoteOnly', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            Remote Only
          </label>
        </div>
      </div>
    </div>
  );
};
