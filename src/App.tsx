import { useState, useEffect } from 'react';
import { JobApplication } from './types';
import { StorageService } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { AddJobForm } from './components/AddJobForm';
import { JobDetail } from './components/JobDetail';
import { Statistics } from './components/Statistics';
import { FollowUpReminders } from './components/FollowUpReminders';
import { EmailGenerator } from './components/EmailGenerator';
import { DemoModePanel } from './components/DemoModePanel';
import { OnboardingModal } from './components/OnboardingModal';
import { ProductTour } from './components/ProductTour';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useOnboarding } from './hooks/useOnboarding';
import { useDarkMode } from './hooks/useDarkMode';

type View = 'dashboard' | 'add' | 'detail' | 'stats';

function App() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [emailGeneratorJob, setEmailGeneratorJob] = useState<JobApplication | null>(null);
  const [reminders, setReminders] = useState<JobApplication[]>([]);

  // Onboarding state
  const onboarding = useOnboarding();

  // Dark mode state
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Load jobs from storage on mount
  useEffect(() => {
    loadJobs();
    loadReminders();
  }, []);

  const loadJobs = () => {
    const loadedJobs = StorageService.getAllApplications();
    setJobs(loadedJobs);
  };

  const loadReminders = () => {
    const needingFollowUp = StorageService.getApplicationsNeedingFollowUp();
    setReminders(needingFollowUp);
  };

  const handleAddSuccess = () => {
    loadJobs();
    loadReminders();
    setCurrentView('dashboard');
  };

  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setCurrentView('detail');
  };

  const handleJobUpdate = () => {
    loadJobs();
    loadReminders();
    if (selectedJob) {
      const updated = StorageService.getApplication(selectedJob.id);
      setSelectedJob(updated);
    }
  };

  const handleDismissReminder = (jobId: string) => {
    StorageService.markFollowUpShown(jobId);
    loadReminders();
  };

  const handleGenerateEmail = (job: JobApplication) => {
    setEmailGeneratorJob(job);
  };

  const handleExportJSON = () => {
    const json = StorageService.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = StorageService.exportAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Application Tracker</h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg transition ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`tour-statistics px-4 py-2 rounded-lg transition ${
                  currentView === 'stats'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Statistics
              </button>

              {/* Export Dropdown */}
              <div className="relative group tour-export">
                <button className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2">
                  Export
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <DarkModeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <>
            {/* Follow-up Reminders */}
            <FollowUpReminders
              jobs={reminders}
              onDismiss={handleDismissReminder}
              onGenerateEmail={handleGenerateEmail}
            />

            {/* Dashboard */}
            <Dashboard
              jobs={jobs}
              onJobClick={handleJobClick}
              onAddJob={() => setCurrentView('add')}
              onJobUpdate={handleJobUpdate}
            />
          </>
        )}

        {currentView === 'add' && (
          <AddJobForm
            onSuccess={handleAddSuccess}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'stats' && (
          <Statistics
            jobs={jobs}
            onClose={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Modals */}
      {currentView === 'detail' && selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => {
            setCurrentView('dashboard');
            setSelectedJob(null);
          }}
          onUpdate={handleJobUpdate}
          onGenerateEmail={handleGenerateEmail}
        />
      )}

      {emailGeneratorJob && (
        <EmailGenerator
          job={emailGeneratorJob}
          onClose={() => setEmailGeneratorJob(null)}
        />
      )}

      {/* Onboarding */}
      <OnboardingModal
        isOpen={onboarding.isOnboarding && !onboarding.isTourActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrevious={onboarding.previousStep}
        onSkip={onboarding.skipOnboarding}
        onStartTour={onboarding.startTour}
      />

      <ProductTour
        isActive={onboarding.isTourActive}
        currentStep={onboarding.tourStep}
        onNext={onboarding.nextTourStep}
        onPrevious={onboarding.previousTourStep}
        onComplete={onboarding.completeTour}
        onSkip={onboarding.skipTour}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Job Application Tracker • Built with React, TypeScript, and Claude AI
          </p>
        </div>
      </footer>

      {/* Demo Mode Panel */}
      <DemoModePanel
        onDataChange={() => {
          loadJobs();
          loadReminders();
        }}
      />
    </div>
  );
}

export default App;
