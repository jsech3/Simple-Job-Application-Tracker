import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideUp } from '../animations/variants';

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface ProductTourProps {
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '.tour-add-button',
    title: 'Add Your First Application',
    description: 'Click here to add a job application. You can paste a URL or enter details manually.',
    position: 'bottom',
  },
  {
    target: '.tour-search',
    title: 'Search & Filter',
    description: 'Quickly find applications by searching or using filters.',
    position: 'bottom',
  },
  {
    target: '.tour-statistics',
    title: 'View Statistics',
    description: 'See your job search progress with charts and insights.',
    position: 'bottom',
  },
  {
    target: '.tour-export',
    title: 'Export Your Data',
    description: 'Export your applications as JSON or CSV anytime.',
    position: 'bottom',
  },
];

export const ProductTour = ({
  isActive,
  currentStep,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
}: ProductTourProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!isActive || !step) return;

    // Scroll the target element into view
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const targetElement = document.querySelector(step.target);
  if (!targetElement) return null;

  const targetRect = targetElement.getBoundingClientRect();

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left;
    }

    // Keep tooltip within viewport
    const maxLeft = window.innerWidth - tooltipWidth - 20;
    const maxTop = window.innerHeight - tooltipHeight - 20;

    return {
      top: Math.max(20, Math.min(top, maxTop)),
      left: Math.max(20, Math.min(left, maxLeft)),
    };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop with spotlight */}
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeIn}
          className="absolute inset-0 bg-black/60"
          style={{
            maskImage: `radial-gradient(
              circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
              transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 10}px,
              black ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px
            )`,
            WebkitMaskImage: `radial-gradient(
              circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
              transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 10}px,
              black ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px
            )`,
          }}
          onClick={onSkip}
        />

        {/* Highlight ring around target */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-lg border-4 border-blue-500 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
          }}
        />

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={slideUp}
          className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-80"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {step.description}
          </p>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Previous
              </button>
            )}

            <button
              onClick={isLastStep ? onComplete : onNext}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {isLastStep ? 'Finish Tour' : 'Next'}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 justify-center mt-4">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
