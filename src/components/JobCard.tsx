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
  const latestStatus: ApplicationStatus = job.statusUpdates.length > 0 && job.statusUpdates[job.statusUpdates.length - 1].nextStep
    ? job.statusUpdates[job.statusUpdates.length - 1].nextStep!
    : ApplicationStatus.Applied;

  // Handle status change
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    const newUpdate = {
      date: new Date().toISOString(),
      heardBack: true,
      nextStep: newStatus,
      notes: `Status changed to ${newStatus}`,
    };
    await StorageService.updateApplication(job.id, {
      statusUpdates: [...job.statusUpdates, newUpdate],
    });
    onUpdate?.();
  };

  // Handle delete
  const handleDelete = async () => {
    await StorageService.deleteApplication(job.id);
    onUpdate?.();
  };

  // Format compensation
  const formatCompensation = () => {
    if (!job.parsedData.compensation) return null;

    const { min, max, currency, period } = job.parsedData.compensation;
    const periodLabel = period === 'annual' ? '/yr' : '/hr';

    if (min && max) {
      return `${currency} ${(min / 1000).toFixed(0)}k\u2013${(max / 1000).toFixed(0)}k${periodLabel}`;
    } else if (min) {
      return `${currency} ${(min / 1000).toFixed(0)}k+${periodLabel}`;
    } else if (max) {
      return `\u2264${currency} ${(max / 1000).toFixed(0)}k${periodLabel}`;
    }

    return null;
  };

  // Status dot color
  const getStatusColor = () => {
    switch (latestStatus) {
      case ApplicationStatus.Applied: return 'bg-zinc-400';
      case ApplicationStatus.PhoneScreenScheduled:
      case ApplicationStatus.PhoneScreenCompleted: return 'bg-blue-400';
      case ApplicationStatus.TechnicalInterview:
      case ApplicationStatus.FinalInterview: return 'bg-amber-400';
      case ApplicationStatus.OfferReceived: return 'bg-emerald-400';
      case ApplicationStatus.Rejected: return 'bg-red-400';
      case ApplicationStatus.Withdrawn: return 'bg-zinc-500';
      default: return 'bg-zinc-400';
    }
  };

  // Work environment badge
  const getWorkEnvStyle = () => {
    switch (job.parsedData.workEnvironment) {
      case 'Remote': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
      case 'Hybrid': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
      case 'In-Office': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10';
      default: return 'text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800';
    }
  };

  const comp = formatCompensation();

  return (
    <div
      onClick={onClick}
      className="accent-bar group relative bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer [&:has([data-headlessui-state~='open'])]:z-50"
    >
      {/* Top row: company + status dropdown */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">{job.parsedData.title}</h3>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">{job.parsedData.company}</p>
        </div>
        <QuickStatusDropdown
          currentStatus={latestStatus}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[12px] text-zinc-400 dark:text-zinc-500 mb-3">
        {job.parsedData.location && (
          <span className="truncate">{job.parsedData.location}</span>
        )}
        {comp && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span className="text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">{comp}</span>
          </>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {/* Status badge with dot */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
          {latestStatus}
        </span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${getWorkEnvStyle()}`}>
          {job.parsedData.workEnvironment}
        </span>
      </div>

      {/* Tags */}
      {job.parsedData.tags && job.parsedData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {job.parsedData.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            >
              {tag}
            </span>
          ))}
          {job.parsedData.tags.length > 4 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 dark:text-zinc-600">
              +{job.parsedData.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-[11px] text-zinc-400 dark:text-zinc-600 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        <span>{formatDistanceToNow(new Date(job.applicationDate), { addSuffix: true })}</span>
        {job.statusUpdates.length > 0 && (
          <span>{job.statusUpdates.length} update{job.statusUpdates.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};
