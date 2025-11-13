import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { ApplicationStatus } from '../types';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QuickStatusDropdownProps {
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
  onDelete?: () => void;
}

const STATUS_COLORS = {
  [ApplicationStatus.Applied]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [ApplicationStatus.PhoneScreenScheduled]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  [ApplicationStatus.PhoneScreenCompleted]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  [ApplicationStatus.TechnicalInterview]: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  [ApplicationStatus.FinalInterview]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  [ApplicationStatus.OfferReceived]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [ApplicationStatus.Rejected]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  [ApplicationStatus.Withdrawn]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_LABELS = {
  [ApplicationStatus.Applied]: 'Applied',
  [ApplicationStatus.PhoneScreenScheduled]: 'Phone Screen Scheduled',
  [ApplicationStatus.PhoneScreenCompleted]: 'Phone Screen Completed',
  [ApplicationStatus.TechnicalInterview]: 'Technical Interview',
  [ApplicationStatus.FinalInterview]: 'Final Interview',
  [ApplicationStatus.OfferReceived]: 'Offer Received',
  [ApplicationStatus.Rejected]: 'Rejected',
  [ApplicationStatus.Withdrawn]: 'Withdrawn',
};

export const QuickStatusDropdown = ({ currentStatus, onStatusChange, onDelete }: QuickStatusDropdownProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const handleStatusChange = (status: ApplicationStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this job application?')) {
      onDelete?.();
    }
  };

  useEffect(() => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, []);

  return (
    <Menu as="div" className="relative inline-block text-left z-50">
      <Menu.Button
        ref={buttonRef}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (buttonRef.current) {
            setButtonRect(buttonRef.current.getBoundingClientRect());
          }
        }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${STATUS_COLORS[currentStatus]} hover:opacity-80`}
      >
        {STATUS_LABELS[currentStatus]}
        <svg
          className="w-4 h-4 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Menu.Button>

      {createPortal(
        <Menu.Items
          style={buttonRect ? {
            position: 'fixed',
            top: `${buttonRect.bottom + 8}px`,
            right: `${window.innerWidth - buttonRect.right}px`,
          } : {}}
          className="w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
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

          {/* Delete option */}
          {onDelete && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleDelete}
                    className={`${
                      active ? 'bg-red-50 dark:bg-red-900/20' : ''
                    } group flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </Menu.Item>
            </>
          )}
        </div>
      </Menu.Items>,
      document.body
      )}
    </Menu>
  );
};
