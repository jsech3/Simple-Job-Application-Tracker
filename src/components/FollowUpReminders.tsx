import { JobApplication } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface FollowUpRemindersProps {
  jobs: JobApplication[];
  onDismiss: (jobId: string) => void;
  onGenerateEmail: (job: JobApplication) => void;
}

export const FollowUpReminders = ({ jobs, onDismiss, onGenerateEmail }: FollowUpRemindersProps) => {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Follow-up Reminders ({jobs.length})
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            You haven't heard back from these applications in over 2 weeks. Consider sending a follow-up email.
          </p>

          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded border border-yellow-200 p-3 flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{job.parsedData.title}</p>
                  <p className="text-sm text-gray-600">
                    {job.parsedData.company} • Applied {formatDistanceToNow(new Date(job.applicationDate), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerateEmail(job)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm"
                  >
                    Generate Email
                  </button>
                  <button
                    onClick={() => onDismiss(job.id)}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
