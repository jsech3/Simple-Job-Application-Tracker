/**
 * A single search result displayed in the results grid.
 *
 * Shows title, company, location, compensation, work-env / work-type badges,
 * platform badge, and a 2-line description snippet. Includes a checkbox for
 * batch selection and dims the card when the result has already been imported.
 *
 * Clicking the card body opens the {@link SearchResultPreview} modal.
 *
 * @module SearchResultCard
 */

import { SearchResult, WorkEnvironment } from '../../types';

interface SearchResultCardProps {
  /** The search result data to display. */
  result: SearchResult;
  /** Whether the card's checkbox is currently checked. */
  isSelected: boolean;
  /** Toggle this result's selection state by ID. */
  onToggleSelect: (id: string) => void;
  /** Open the preview modal for this result. */
  onClick: (result: SearchResult) => void;
}

/** Card component for a single job search result with batch-select checkbox. */
export const SearchResultCard = ({ result, isSelected, onToggleSelect, onClick }: SearchResultCardProps) => {
  const formatCompensation = () => {
    if (!result.compensation) return null;
    const { min, max, currency, period } = result.compensation;
    const periodLabel = period === 'annual' ? '/yr' : '/hr';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}${periodLabel}`;
    if (min) return `${currency} ${min.toLocaleString()}+${periodLabel}`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}${periodLabel}`;
    return null;
  };

  const getWorkEnvColor = () => {
    switch (result.workEnvironment) {
      case WorkEnvironment.Remote:
        return 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300';
      case WorkEnvironment.Hybrid:
        return 'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case WorkEnvironment.InOffice:
        return 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const comp = formatCompensation();

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700'
      } ${result.imported ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(result.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
        />
      </div>

      {/* Imported badge */}
      {result.imported && (
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
          Imported
        </div>
      )}

      {/* Content (clickable area) */}
      <div onClick={() => onClick(result)} className="pl-7">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 pr-16">
          {result.title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{result.company}</p>

        {/* Location + compensation */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          {result.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {result.location}
            </span>
          )}
          {comp && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {comp}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {result.workEnvironment !== 'Not Specified' && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getWorkEnvColor()}`}>
              {result.workEnvironment}
            </span>
          )}
          {result.workType !== 'Not Specified' && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {result.workType}
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {result.platform}
          </span>
        </div>

        {/* Description snippet */}
        {result.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {result.description.substring(0, 200)}
            {result.description.length > 200 ? '...' : ''}
          </p>
        )}
      </div>
    </div>
  );
};
