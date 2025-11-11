import { useState } from 'react';
import { StorageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  JobApplication,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  ApplicationStatus,
} from '../types';

interface TestingPanelProps {
  onDataChange: () => void;
}

export const TestingPanel = ({ onDataChange }: TestingPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>('');

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const generateTestJob = (index: number, daysAgo: number = 0): JobApplication => {
    const companies = ['TechCorp', 'StartupXYZ', 'BigCo', 'CloudCompany', 'MegaCorp'];
    const titles = ['Senior Frontend Engineer', 'Backend Developer', 'Full Stack Engineer', 'DevOps Engineer', 'Software Engineer'];
    const locations = ['San Francisco, CA', 'New York, NY', 'Remote', 'Austin, TX', 'Seattle, WA'];
    const platforms = Object.values(JobPlatform);
    const workEnvs = Object.values(WorkEnvironment);
    const workTypes = Object.values(WorkType);

    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: uuidv4(),
      url: `https://example.com/job/${uuidv4()}`,
      parsedData: {
        title: titles[index % titles.length],
        company: companies[index % companies.length],
        compensation: Math.random() > 0.3 ? {
          min: 100000 + (index * 10000),
          max: 150000 + (index * 10000),
          currency: 'USD',
          period: 'annual',
        } : null,
        workEnvironment: workEnvs[index % workEnvs.length],
        workType: workTypes[index % workTypes.length],
        location: locations[index % locations.length],
        platform: platforms[index % platforms.length],
        benefits: ['Health Insurance', '401k', 'Unlimited PTO'].slice(0, Math.floor(Math.random() * 3) + 1),
        descriptionSummary: `Looking for a talented engineer to join our ${companies[index % companies.length]} team. This is a great opportunity!`,
      },
      userNotes: Math.random() > 0.5 ? 'Excited about this role!' : '',
      hasApplied: true,
      applicationDate: date.toISOString(),
      statusUpdates: [],
      followUpReminderShown: false,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };
  };

  const handleAddTestJobs = (count: number) => {
    try {
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const job = generateTestJob(i, daysAgo);

        // Add some with status updates
        if (Math.random() > 0.7) {
          job.statusUpdates.push({
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            heardBack: true,
            nextStep: ApplicationStatus.PhoneScreenScheduled,
            notes: 'Interview scheduled',
          });
        }

        StorageService.saveApplication(job);
      }
      onDataChange();
      showMessage(`✅ Added ${count} test jobs`);
    } catch (error) {
      showMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddOldJob = () => {
    try {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 21); // 3 weeks ago

      const job = generateTestJob(0, 21);
      job.parsedData.title = 'Old Application (Should Trigger Reminder)';
      job.followUpReminderShown = false;

      StorageService.saveApplication(job);
      onDataChange();
      showMessage('✅ Added old job (should show follow-up reminder)');
    } catch (error) {
      showMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearAllData = () => {
    if (confirm('⚠️ This will delete ALL applications. Are you sure?')) {
      StorageService.clearAllData();
      onDataChange();
      showMessage('✅ All data cleared');
    }
  };

  const handleRunAutomatedTests = async () => {
    showMessage('🧪 Running tests in console...');
    try {
      // @ts-ignore
      const { runAllTests } = await import('../tests/testRunner.ts');
      await runAllTests();
      showMessage('✅ Tests complete - check console');
    } catch (error) {
      showMessage(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const handleExportLogs = () => {
    const stats = StorageService.getStatistics();
    const apps = StorageService.getAllApplications();

    const logs = {
      timestamp: new Date().toISOString(),
      totalApplications: apps.length,
      stats,
      localStorageSize: new Blob([JSON.stringify(apps)]).size,
      sampleApplication: apps[0] || null,
    };

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('✅ Debug logs exported');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition text-sm font-medium z-50"
        title="Open Testing Panel"
      >
        🧪 Testing
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg shadow-2xl p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-purple-900">🧪 Testing Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => handleAddTestJobs(5)}
          className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm"
        >
          Add 5 Test Jobs
        </button>

        <button
          onClick={() => handleAddTestJobs(50)}
          className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm"
        >
          Add 50 Test Jobs
        </button>

        <button
          onClick={handleAddOldJob}
          className="w-full bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 transition text-sm"
        >
          Add Old Job (Trigger Reminder)
        </button>

        <button
          onClick={handleRunAutomatedTests}
          className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
        >
          Run Automated Tests
        </button>

        <button
          onClick={handleExportLogs}
          className="w-full bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition text-sm"
        >
          Export Debug Logs
        </button>

        <button
          onClick={handleClearAllData}
          className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition text-sm"
        >
          Clear All Data ⚠️
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <p>💡 Check browser console for test output</p>
        <p className="mt-1">📖 See TESTING.md for full guide</p>
      </div>
    </div>
  );
};
