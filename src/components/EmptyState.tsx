import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../animations/variants';

interface EmptyStateProps {
  type: 'no-jobs' | 'no-results' | 'no-reminders' | 'no-stats';
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  title?: string;
  description?: string;
}

const DEFAULT_CONTENT = {
  'no-jobs': {
    icon: (
      <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'No applications yet',
    description: 'Get started by adding your first job application. Track applications, get reminders, and visualize your progress—all in one place.',
  },
  'no-results': {
    icon: (
      <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'No applications found',
    description: "We couldn't find any applications matching your filters. Try adjusting your search or filters.",
  },
  'no-reminders': {
    icon: (
      <svg className="w-20 h-20 text-green-400 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "You're all caught up!",
    description: 'No follow-up reminders at the moment. Keep applying and tracking your applications.',
  },
  'no-stats': {
    icon: (
      <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Not enough data yet',
    description: 'Add at least 5 applications to see meaningful insights and statistics.',
  },
};

export const EmptyState = ({ type, action, title, description }: EmptyStateProps) => {
  const content = DEFAULT_CONTENT[type];
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        {content.icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
      >
        {displayTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto"
      >
        {displayDescription}
      </motion.p>

      {/* Action Button */}
      {action && (
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.icon || (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {action.label}
        </motion.button>
      )}

      {/* Additional Tips */}
      {type === 'no-jobs' && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            💡 <strong>Pro tip:</strong> The app works best with 5+ applications
          </p>
          <div className="flex gap-4 justify-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Track applications
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Get reminders
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              View insights
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
