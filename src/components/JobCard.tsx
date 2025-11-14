import { JobApplication, ApplicationStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { QuickStatusDropdown } from './QuickStatusDropdown';
import { StorageService } from '../services/storage';

interface JobCardProps {
  job: JobApplication;
  onClick: () => void;
  onUpdate?: () => void;
}

export const JobCard = ({ job, onClick, onUpdate }: JobCardProps) => {
  // Get latest status
  const latestStatus = job.statusUpdates.length > 0 && job.statusUpdates[job.statusUpdates.length - 1].nextStep
    ? job.statusUpdates[job.statusUpdates.length - 1].nextStep
    : ApplicationStatus.Applied;

  // Handle status change
  const handleStatusChange = (newStatus: ApplicationStatus) => {
    StorageService.addStatusUpdate(job.id, {
      date: new Date().toISOString(),
      status: `Status changed to ${newStatus}`,
      nextStep: newStatus,
    });
    onUpdate?.();
  };

  // Handle delete
  const handleDelete = () => {
    StorageService.deleteApplication(job.id);
    onUpdate?.();
  };

  // Format compensation
  const formatCompensation = () => {
    if (!job.parsedData.compensation) return 'Not specified';

    const { min, max, currency, period } = job.parsedData.compensation;
    const periodLabel = period === 'annual' ? '/year' : '/hour';

    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}${periodLabel}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+${periodLabel}`;
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}${periodLabel}`;
    }

    return 'Not specified';
  };

  // Status badge color
  const getStatusColor = () => {
    switch (latestStatus) {
      case ApplicationStatus.OfferReceived:
        return 'bg-green-100 text-green-800 border-green-200';
      case ApplicationStatus.Rejected:
      case ApplicationStatus.Withdrawn:
        return 'bg-red-100 text-red-800 border-red-200';
      case ApplicationStatus.PhoneScreenScheduled:
      case ApplicationStatus.TechnicalInterview:
      case ApplicationStatus.FinalInterview:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ApplicationStatus.PhoneScreenCompleted:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Work environment badge color
  const getWorkEnvColor = () => {
    switch (job.parsedData.workEnvironment) {
      case 'Remote':
        return 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'Hybrid':
        return 'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'In-Office':
        return 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer [&:has([data-headlessui-state~='open'])]:z-50"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{job.parsedData.title}</h3>
          <p className="text-md text-gray-700 dark:text-gray-300">{job.parsedData.company}</p>
        </div>
        <QuickStatusDropdown
          currentStatus={latestStatus}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {job.parsedData.location && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.parsedData.location}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatCompensation()}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getWorkEnvColor()}`}>
          {job.parsedData.workEnvironment}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {job.parsedData.workType}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {job.parsedData.platform}
        </span>
      </div>

      {/* Tags */}
      {job.parsedData.tags && job.parsedData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.parsedData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span>Applied {formatDistanceToNow(new Date(job.applicationDate), { addSuffix: true })}</span>
        {job.statusUpdates.length > 0 && (
          <span>{job.statusUpdates.length} update{job.statusUpdates.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};
