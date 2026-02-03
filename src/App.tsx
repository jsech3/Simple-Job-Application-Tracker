import { useState, useEffect, useRef } from 'react';
import { JobApplication } from './types';
import { StorageService } from './services/storage';
import { useAuth } from './components/AuthContext';
import { migrateLocalDataToSupabase } from './services/dataMigration';
import { Dashboard } from './components/Dashboard';
import { AddJobForm } from './components/AddJobForm';
import { JobDetail } from './components/JobDetail';
import { Statistics } from './components/Statistics';
import { FollowUpReminders } from './components/FollowUpReminders';
import { EmailGenerator } from './components/EmailGenerator';
import { DemoModePanel } from './components/DemoModePanel';
import { JobSearch } from './components/JobSearch';
import { OnboardingModal } from './components/OnboardingModal';
import { ProductTour } from './components/ProductTour';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useOnboarding } from './hooks/useOnboarding';
import { useDarkMode } from './hooks/useDarkMode';

type View = 'dashboard' | 'add' | 'detail' | 'stats' | 'search';

const BETA_KEY = 'beta_features_enabled';

function App() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [emailGeneratorJob, setEmailGeneratorJob] = useState<JobApplication | null>(null);
  const [reminders, setReminders] = useState<JobApplication[]>([]);
  const [migrationToast, setMigrationToast] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [betaEnabled, setBetaEnabled] = useState(() => localStorage.getItem(BETA_KEY) === 'true');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleBeta = () => {
    setBetaEnabled(prev => {
      const next = !prev;
      localStorage.setItem(BETA_KEY, String(next));
      if (!next && currentView === 'search') setCurrentView('dashboard');
      return next;
    });
  };

  const { user, isGuestMode, signOut } = useAuth();
  const onboarding = useOnboarding();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Run migration on first authenticated load
  useEffect(() => {
    if (!user) return;
    migrateLocalDataToSupabase(user.id).then(count => {
      if (count > 0) {
        setMigrationToast(`Migrated ${count} job${count === 1 ? '' : 's'} to cloud storage`);
        setTimeout(() => setMigrationToast(null), 5000);
        loadJobs();
      }
    });
  }, [user]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load jobs from storage on mount
  useEffect(() => {
    loadJobs();
    loadReminders();
  }, []);

  const loadJobs = async () => {
    const loadedJobs = await StorageService.getAllApplications();
    setJobs(loadedJobs);
  };

  const loadReminders = async () => {
    const needingFollowUp = await StorageService.getApplicationsNeedingFollowUp();
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

  const handleJobUpdate = async () => {
    loadJobs();
    loadReminders();
    if (selectedJob) {
      const updated = await StorageService.getApplication(selectedJob.id);
      setSelectedJob(updated);
    }
  };

  const handleDismissReminder = async (jobId: string) => {
    await StorageService.markFollowUpShown(jobId);
    loadReminders();
  };

  const handleGenerateEmail = (job: JobApplication) => {
    setEmailGeneratorJob(job);
  };

  const handleExportJSON = async () => {
    const json = await StorageService.exportAsJSON();
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

  const handleExportCSV = async () => {
    const csv = await StorageService.exportAsCSV();
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

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Tracker</span>
          </button>

          {/* Center nav pills */}
          <nav className="hidden sm:flex items-center bg-gray-100/70 dark:bg-zinc-800/50 rounded-lg p-0.5">
            {(['dashboard', 'stats', ...(betaEnabled ? ['search' as const] : [])] as const).map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  currentView === view
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                } ${view === 'stats' ? 'tour-statistics' : ''}`}
              >
                {view === 'dashboard' ? 'Dashboard' : view === 'stats' ? 'Statistics' : 'Search'}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Export Dropdown */}
            <div className="relative group tour-export">
              <button className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                >
                  Export as CSV
                </button>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />

            {/* User avatar / logout */}
            {!isGuestMode && user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="ml-1 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  title={user.email ?? 'Account'}
                >
                  {userInitial}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                      <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={toggleBeta}
                      className="w-full text-left px-4 py-3 text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition flex items-center justify-between"
                    >
                      <span>Beta features</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${betaEnabled ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-500'}`}>
                        {betaEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); signOut(); }}
                      className="w-full text-left px-4 py-3 text-[13px] text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition border-t border-gray-100 dark:border-zinc-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Guest badge + beta toggle for guests */}
            {isGuestMode && (
              <>
                <button
                  onClick={toggleBeta}
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-md font-medium border transition ${
                    betaEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'
                  }`}
                  title="Toggle beta features"
                >
                  Beta {betaEnabled ? 'ON' : 'OFF'}
                </button>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-700">
                  Guest
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Migration toast */}
      {migrationToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          {migrationToast}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {currentView === 'search' && betaEnabled && (
          <JobSearch
            onImportSuccess={() => {
              loadJobs();
              loadReminders();
            }}
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
      <footer className="border-t border-gray-200/60 dark:border-zinc-800/60 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-[12px] text-zinc-400 dark:text-zinc-600 tracking-wide">
            Built with React, TypeScript & Claude AI
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
