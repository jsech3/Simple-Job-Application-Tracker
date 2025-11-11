import { Menu } from '@headlessui/react';
import { motion } from 'framer-motion';
import { ApplicationStatus } from '../types';

interface QuickStatusDropdownProps {
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
}

const STATUS_COLORS = {
  [ApplicationStatus.Applied]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [ApplicationStatus.PhoneScreen]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  [ApplicationStatus.Interview]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  [ApplicationStatus.TechnicalAssessment]: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  [ApplicationStatus.OnSite]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  [ApplicationStatus.Offer]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [ApplicationStatus.Accepted]: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  [ApplicationStatus.Rejected]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  [ApplicationStatus.Withdrawn]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_LABELS = {
  [ApplicationStatus.Applied]: 'Applied',
  [ApplicationStatus.PhoneScreen]: 'Phone Screen',
  [ApplicationStatus.Interview]: 'Interview',
  [ApplicationStatus.TechnicalAssessment]: 'Technical',
  [ApplicationStatus.OnSite]: 'On-Site',
  [ApplicationStatus.Offer]: 'Offer',
  [ApplicationStatus.Accepted]: 'Accepted',
  [ApplicationStatus.Rejected]: 'Rejected',
  [ApplicationStatus.Withdrawn]: 'Withdrawn',
};

export const QuickStatusDropdown = ({ currentStatus, onStatusChange }: QuickStatusDropdownProps) => {
  const handleStatusChange = (status: ApplicationStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${STATUS_COLORS[currentStatus]} hover:opacity-80`}
          >
            {STATUS_LABELS[currentStatus]}
            <svg
              className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Menu.Button>

          {open && (
            <Menu.Items
              static
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 w-48 origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="py-1">
                {Object.values(ApplicationStatus).map((status) => (
                  <Menu.Item key={status}>
                    {({ active }) => (
                      <button
                        onClick={() => handleStatusChange(status)}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } ${
                          status === currentStatus ? 'font-semibold' : ''
                        } group flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-900 dark:text-gray-100`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full ${STATUS_COLORS[status].split(' ')[0]}`}
                        />
                        {STATUS_LABELS[status]}
                        {status === currentStatus && (
                          <svg
                            className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          )}
        </>
      )}
    </Menu>
  );
};
