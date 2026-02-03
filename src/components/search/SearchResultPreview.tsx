/**
 * Full-screen modal for previewing and editing a search result before import.
 *
 * All fields (title, company, location, platform, work env, work type,
 * compensation) are editable. The user can also add notes and view the full
 * description and benefits. Clicking "Import to Tracker" converts the result
 * to a {@link JobApplication} and saves it via {@link StorageService}.
 *
 * Animated with Framer Motion (backdrop fade + modal scale-slide).
 *
 * @module SearchResultPreview
 */

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult, JobApplication, WorkEnvironment, WorkType, JobPlatform, Compensation } from '../../types';
import { StorageService } from '../../services/storage';
import { backdropVariants, modalVariants } from '../../animations/variants';

interface SearchResultPreviewProps {
  /** The result to preview — fields are copied into local state for editing. */
  result: SearchResult;
  /** Close the modal without importing. */
  onClose: () => void;
  /** Called after a successful import with the result's ID so the parent can mark it. */
  onImported: (id: string) => void;
}

/** Modal for reviewing, editing, and importing a single search result. */
export const SearchResultPreview = ({ result, onClose, onImported }: SearchResultPreviewProps) => {
  const [title, setTitle] = useState(result.title);
  const [company, setCompany] = useState(result.company);
  const [location, setLocation] = useState(result.location);
  const [workEnvironment, setWorkEnvironment] = useState(result.workEnvironment);
  const [workType, setWorkType] = useState(result.workType);
  const [platform, setPlatform] = useState(result.platform);
  const [userNotes, setUserNotes] = useState('');
  const [compMin, setCompMin] = useState<string>(result.compensation?.min?.toString() || '');
  const [compMax, setCompMax] = useState<string>(result.compensation?.max?.toString() || '');
  const [compCurrency, setCompCurrency] = useState(result.compensation?.currency || 'USD');
  const [compPeriod, setCompPeriod] = useState<'annual' | 'hourly'>(result.compensation?.period || 'annual');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!title.trim() || !company.trim()) {
      setError('Title and company are required');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const compensation: Compensation | null =
        compMin || compMax
          ? {
              min: compMin ? Number(compMin) : undefined,
              max: compMax ? Number(compMax) : undefined,
              currency: compCurrency,
              period: compPeriod,
            }
          : null;

      const application: JobApplication = {
        id: uuidv4(),
        url: result.url || '',
        parsedData: {
          title,
          company,
          compensation,
          workEnvironment,
          workType,
          location,
          platform,
          benefits: result.benefits,
          descriptionSummary: result.description,
          tags: result.tags,
        },
        userNotes,
        hasApplied: false,
        applicationDate: new Date().toISOString(),
        statusUpdates: [],
        followUpReminderShown: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveApplication(application);
      onImported(result.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{result.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{result.company}</p>
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

          {/* Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as JobPlatform)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(JobPlatform).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Environment</label>
                <select
                  value={workEnvironment}
                  onChange={(e) => setWorkEnvironment(e.target.value as WorkEnvironment)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(WorkEnvironment).map(env => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work Type</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as WorkType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(WorkType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compensation */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compensation</label>
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="number"
                  value={compMin}
                  onChange={(e) => setCompMin(e.target.value)}
                  placeholder="Min"
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                />
                <input
                  type="number"
                  value={compMax}
                  onChange={(e) => setCompMax(e.target.value)}
                  placeholder="Max"
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={compCurrency}
                  onChange={(e) => setCompCurrency(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                />
                <select
                  value={compPeriod}
                  onChange={(e) => setCompPeriod(e.target.value as 'annual' | 'hourly')}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm"
                >
                  <option value="annual">Annual</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {result.description}
                </div>
              </div>
            )}

            {/* Benefits */}
            {result.benefits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benefits</label>
                <div className="flex flex-wrap gap-1.5">
                  {result.benefits.map((b, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this position..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* URL */}
            {result.url && (
              <div className="text-sm">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View original posting
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || result.imported}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              {result.imported ? 'Already Imported' : isImporting ? 'Importing...' : 'Import to Tracker'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
