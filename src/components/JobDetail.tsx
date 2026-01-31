import { useState } from 'react';
import { JobApplication, ApplicationStatus, StatusUpdate } from '../types';
import { StorageService } from '../services/storage';
import { formatDistanceToNow, format } from 'date-fns';

interface JobDetailProps {
  job: JobApplication;
  onClose: () => void;
  onUpdate: () => void;
  onGenerateEmail: (job: JobApplication) => void;
}

export const JobDetail = ({ job, onClose, onUpdate, onGenerateEmail }: JobDetailProps) => {
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [heardBack, setHeardBack] = useState(false);
  const [nextStep, setNextStep] = useState<ApplicationStatus | ''>('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // Handle status update submission
  const handleStatusUpdate = async () => {
    setIsSaving(true);

    const newUpdate: StatusUpdate = {
      date: new Date().toISOString(),
      heardBack,
      nextStep: nextStep as ApplicationStatus || undefined,
      notes: updateNotes || undefined,
    };

    const updatedStatusUpdates = [...job.statusUpdates, newUpdate];

    const success = await StorageService.updateApplication(job.id, {
      statusUpdates: updatedStatusUpdates,
    });

    if (success) {
      setShowStatusUpdate(false);
      setHeardBack(false);
      setNextStep('');
      setUpdateNotes('');
      onUpdate();
    }

    setIsSaving(false);
  };

  // Get latest status
  const latestStatus = job.statusUpdates.length > 0 && job.statusUpdates[job.statusUpdates.length - 1].nextStep
    ? job.statusUpdates[job.statusUpdates.length - 1].nextStep
    : ApplicationStatus.Applied;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{job.parsedData.title}</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">{job.parsedData.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Info */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {latestStatus}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
              {job.parsedData.workEnvironment}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
              {job.parsedData.workType}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
              {job.parsedData.platform}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</h3>
              <p className="text-gray-900 dark:text-white">{job.parsedData.location || 'Not specified'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Compensation</h3>
              <p className="text-gray-900 dark:text-white">{formatCompensation()}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Applied</h3>
              <p className="text-gray-900 dark:text-white">
                {format(new Date(job.applicationDate), 'PPP')}
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                  ({formatDistanceToNow(new Date(job.applicationDate), { addSuffix: true })})
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Job URL</h3>
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  View Original Posting →
                </a>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Not available</p>
              )}
            </div>
          </div>

          {/* Description */}
          {job.parsedData.descriptionSummary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Job Description Summary</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{job.parsedData.descriptionSummary}</p>
            </div>
          )}

          {/* Benefits */}
          {job.parsedData.benefits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {job.parsedData.benefits.map((benefit, index) => (
                  <span key={index} className="px-2 py-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Notes */}
          {job.userNotes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Notes</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{job.userNotes}</p>
              </div>
            </div>
          )}

          {/* Status Updates Timeline */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Timeline</h3>
            <div className="space-y-4">
              {/* Initial Application */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {job.statusUpdates.length > 0 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-gray-900 dark:text-white">Application Submitted</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(job.applicationDate), 'PPP')}</p>
                </div>
              </div>

              {/* Status Updates */}
              {job.statusUpdates.map((update, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${
                      update.heardBack ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                    } flex items-center justify-center`}>
                      {update.heardBack ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {index < job.statusUpdates.length - 1 && <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {update.heardBack ? 'Heard Back' : 'Update'}
                      {update.nextStep && ` - ${update.nextStep}`}
                    </p>
                    {update.notes && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{update.notes}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{format(new Date(update.date), 'PPP')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Status Update Form */}
          {showStatusUpdate ? (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Add Status Update</h3>

              {/* Heard Back Toggle */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={heardBack}
                    onChange={(e) => setHeardBack(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Have you heard back?</span>
                </label>
              </div>

              {/* Next Step */}
              {heardBack && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What's the next step?
                  </label>
                  <select
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value as ApplicationStatus)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status...</option>
                    {Object.values(ApplicationStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  rows={3}
                  placeholder="Any updates or feelings to note..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleStatusUpdate}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {isSaving ? 'Saving...' : 'Save Update'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusUpdate(false);
                    setHeardBack(false);
                    setNextStep('');
                    setUpdateNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="w-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Status Update
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
          <button
            onClick={() => onGenerateEmail(job)}
            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Generate Follow-up Email
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
