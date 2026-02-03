import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock all heavy dependencies to keep the test focused on beta toggle logic

vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    isGuestMode: true,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../services/storage', () => ({
  StorageService: {
    getAllApplications: vi.fn().mockResolvedValue([]),
    getApplicationsNeedingFollowUp: vi.fn().mockResolvedValue([]),
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/dataMigration', () => ({
  migrateLocalDataToSupabase: vi.fn().mockResolvedValue(0),
}));

vi.mock('../../hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    isOnboarding: false,
    isTourActive: false,
    currentStep: 0,
    tourStep: 0,
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    skipOnboarding: vi.fn(),
    startTour: vi.fn(),
    nextTourStep: vi.fn(),
    previousTourStep: vi.fn(),
    completeTour: vi.fn(),
    skipTour: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  }),
}));

// Mock child components that are not relevant to beta toggle testing
vi.mock('../Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('../AddJobForm', () => ({
  AddJobForm: () => <div>AddJobForm</div>,
}));

vi.mock('../JobDetail', () => ({
  JobDetail: () => <div>JobDetail</div>,
}));

vi.mock('../Statistics', () => ({
  Statistics: () => <div data-testid="statistics">Statistics</div>,
}));

vi.mock('../FollowUpReminders', () => ({
  FollowUpReminders: () => null,
}));

vi.mock('../EmailGenerator', () => ({
  EmailGenerator: () => null,
}));

vi.mock('../DemoModePanel', () => ({
  DemoModePanel: () => null,
}));

vi.mock('../JobSearch', () => ({
  JobSearch: () => <div data-testid="job-search">JobSearch</div>,
}));

vi.mock('../OnboardingModal', () => ({
  OnboardingModal: () => null,
}));

vi.mock('../ProductTour', () => ({
  ProductTour: () => null,
}));

vi.mock('../DarkModeToggle', () => ({
  DarkModeToggle: () => null,
}));

import App from '../../App';

describe('App beta toggle behavior', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hides Search tab when beta is off (default)', () => {
    render(<App />);

    const navButtons = screen.getAllByRole('button');
    const searchButton = navButtons.find(btn => btn.textContent === 'Search');
    expect(searchButton).toBeUndefined();
  });

  it('shows Search tab when beta is enabled', () => {
    localStorage.setItem('beta_features_enabled', 'true');
    render(<App />);

    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('toggling beta off while on search tab redirects to dashboard', async () => {
    localStorage.setItem('beta_features_enabled', 'true');
    render(<App />);

    // Navigate to search tab
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByTestId('job-search')).toBeInTheDocument();

    // Toggle beta off via the guest beta button
    const betaButton = screen.getByTitle('Toggle beta features');
    fireEvent.click(betaButton);

    // Should redirect to dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    // Search tab should no longer be in nav
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
  });
});
