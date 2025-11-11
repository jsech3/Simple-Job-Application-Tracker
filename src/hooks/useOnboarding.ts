import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'job_tracker_onboarding_complete';
const TOUR_KEY = 'job_tracker_tour_complete';

export type OnboardingStep = 'welcome' | 'features' | 'tour' | 'complete';

interface OnboardingState {
  isOnboarding: boolean;
  currentStep: OnboardingStep;
  hasSeenOnboarding: boolean;
  isTourActive: boolean;
  tourStep: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  startTour: () => void;
  skipTour: () => void;
  nextTourStep: () => void;
  previousTourStep: () => void;
  completeTour: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = ['welcome', 'features', 'tour', 'complete'];

export const useOnboarding = (): OnboardingState => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  // Check if onboarding should be shown on mount
  useEffect(() => {
    if (!hasSeenOnboarding) {
      setIsOnboarding(true);
    }
  }, [hasSeenOnboarding]);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep('welcome');
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(TOUR_KEY, 'true');
  };

  const skipOnboarding = () => {
    setIsOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const nextStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1]);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1]);
    }
  };

  const startTour = () => {
    setIsTourActive(true);
    setTourStep(0);
    setCurrentStep('tour');
  };

  const skipTour = () => {
    setIsTourActive(false);
    completeOnboarding();
  };

  const nextTourStep = () => {
    setTourStep(prev => prev + 1);
  };

  const previousTourStep = () => {
    setTourStep(prev => Math.max(0, prev - 1));
  };

  const completeTour = () => {
    setIsTourActive(false);
    completeOnboarding();
  };

  return {
    isOnboarding,
    currentStep,
    hasSeenOnboarding,
    isTourActive,
    tourStep,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    previousStep,
    startTour,
    skipTour,
    nextTourStep,
    previousTourStep,
    completeTour,
  };
};
