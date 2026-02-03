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
      <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'No applications yet',
    description: 'Start tracking your job search. Add your first application to get reminders, insights, and more.',
  },
  'no-results': {
    icon: (
      <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'No matches',
    description: 'Try adjusting your search or filters.',
  },
  'no-reminders': {
    icon: (
      <svg className="w-12 h-12 text-emerald-300 dark:text-emerald-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "All caught up",
    description: 'No follow-up reminders right now.',
  },
  'no-stats': {
    icon: (
      <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Not enough data',
    description: 'Add at least 5 applications for meaningful insights.',
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
      className="glass-card rounded-xl py-16 px-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-5"
      >
        {content.icon}
      </motion.div>

      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2"
      >
        {displayTitle}
      </motion.h3>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[13px] text-zinc-500 dark:text-zinc-500 mb-6 max-w-sm mx-auto"
      >
        {displayDescription}
      </motion.p>

      {action && (
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition text-[13px] font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.icon || (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};
