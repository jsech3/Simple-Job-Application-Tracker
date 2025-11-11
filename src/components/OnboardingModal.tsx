import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, backdropVariants } from '../animations/variants';
import { OnboardingStep } from '../hooks/useOnboarding';

interface OnboardingModalProps {
  isOpen: boolean;
  currentStep: OnboardingStep;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onStartTour: () => void;
}

export const OnboardingModal = ({
  isOpen,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onStartTour,
}: OnboardingModalProps) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="text-center"
          >
            <div className="mb-6">
              <svg className="w-20 h-20 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Job Application Tracker!
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Track your job applications, get smart reminders, and visualize your progress—all in one place.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={onNext}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Get Started
              </button>
              <button
                onClick={onSkip}
                className="text-gray-600 dark:text-gray-400 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Skip Introduction
              </button>
            </div>
          </motion.div>
        );

      case 'features':
        return (
          <motion.div
            key="features"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Key Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Quick Entry</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Add jobs in seconds with manual entry or try pasting a URL
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update status, add notes, and track your entire journey
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Follow-up Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get reminded to follow up after 2 weeks of silence
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Insights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Visualize your progress with charts and statistics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-between">
              <button
                onClick={onPrevious}
                className="text-gray-600 dark:text-gray-400 px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={onNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Continue
              </button>
            </div>
          </motion.div>
        );

      case 'tour':
        return (
          <motion.div
            key="tour"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="text-center"
          >
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready for a Quick Tour?
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Let us show you around! We'll highlight the main features so you can get started quickly.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={onStartTour}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start Tour
              </button>
              <button
                onClick={onSkip}
                className="text-gray-600 dark:text-gray-400 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Skip Tour
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && currentStep !== 'complete' && (
        <Dialog
          open={isOpen}
          onClose={onSkip}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
          />

          {/* Full-screen container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl"
            >
              {renderStepContent()}
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
