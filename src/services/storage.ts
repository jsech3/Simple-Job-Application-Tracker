import { JobApplication, ApplicationStats, ApplicationStatus, JobPlatform, WorkEnvironment, WorkType } from '../types';

const STORAGE_KEY = 'job_applications';
const VERSION_KEY = 'job_tracker_version';
const CURRENT_VERSION = '1.0.0';

export class StorageService {
  // Initialize storage (check version, migrate if needed)
  static initialize(): void {
    const version = localStorage.getItem(VERSION_KEY);
    if (!version) {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }

    // Ensure storage exists
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }

  // Get all job applications
  static getAllApplications(): JobApplication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as JobApplication[];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Get a single application by ID
  static getApplication(id: string): JobApplication | null {
    const applications = this.getAllApplications();
    return applications.find(app => app.id === id) || null;
  }

  // Save a new application
  static saveApplication(application: JobApplication): boolean {
    try {
      const applications = this.getAllApplications();

      // Check for duplicate URL (only if URL is provided)
      if (application.url && application.url.trim() !== '') {
        const duplicate = applications.find(app => app.url === application.url);
        if (duplicate) {
          throw new Error(`You already applied to this job on ${new Date(duplicate.applicationDate).toLocaleDateString()}`);
        }
      }

      applications.push(application);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      return true;
    } catch (error) {
      console.error('Error saving application:', error);
      throw error;
    }
  }

  // Update an existing application
  static updateApplication(id: string, updates: Partial<JobApplication>): boolean {
    try {
      const applications = this.getAllApplications();
      const index = applications.findIndex(app => app.id === id);

      if (index === -1) {
        throw new Error('Application not found');
      }

      applications[index] = {
        ...applications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
    }
  }

  // Delete an application
  static deleteApplication(id: string): boolean {
    try {
      const applications = this.getAllApplications();
      const filtered = applications.filter(app => app.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  }

  // Mark follow-up reminder as shown
  static markFollowUpShown(id: string): boolean {
    return this.updateApplication(id, { followUpReminderShown: true });
  }

  // Get applications that need follow-up
  static getApplicationsNeedingFollowUp(): JobApplication[] {
    const applications = this.getAllApplications();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    return applications.filter(app => {
      // Skip if already shown reminder
      if (app.followUpReminderShown) return false;

      // Skip if already heard back
      const latestUpdate = app.statusUpdates[app.statusUpdates.length - 1];
      if (latestUpdate && latestUpdate.heardBack) return false;

      // Check if applied more than 2 weeks ago
      const applicationDate = new Date(app.applicationDate);
      return applicationDate < twoWeeksAgo;
    });
  }

  // Export all data as JSON
  static exportAsJSON(): string {
    const applications = this.getAllApplications();
    return JSON.stringify(applications, null, 2);
  }

  // Export all data as CSV
  static exportAsCSV(): string {
    const applications = this.getAllApplications();

    if (applications.length === 0) {
      return 'No applications to export';
    }

    // CSV headers
    const headers = [
      'Date Applied',
      'Company',
      'Job Title',
      'Location',
      'Work Environment',
      'Work Type',
      'Compensation',
      'Platform',
      'Status',
      'URL',
      'Notes',
    ];

    // CSV rows
    const rows = applications.map(app => {
      const latestStatus = app.statusUpdates.length > 0
        ? app.statusUpdates[app.statusUpdates.length - 1].nextStep || 'Applied'
        : 'Applied';

      const compensation = app.parsedData.compensation
        ? `${app.parsedData.compensation.currency} ${app.parsedData.compensation.min || ''}-${app.parsedData.compensation.max || ''} ${app.parsedData.compensation.period}`
        : 'Not specified';

      return [
        new Date(app.applicationDate).toLocaleDateString(),
        app.parsedData.company,
        app.parsedData.title,
        app.parsedData.location,
        app.parsedData.workEnvironment,
        app.parsedData.workType,
        compensation,
        app.parsedData.platform,
        latestStatus,
        app.url,
        app.userNotes.replace(/"/g, '""'), // Escape quotes
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  // Import data from JSON
  static importFromJSON(jsonString: string): boolean {
    try {
      const applications = JSON.parse(jsonString) as JobApplication[];

      // Validate data structure
      if (!Array.isArray(applications)) {
        throw new Error('Invalid data format');
      }

      // Merge with existing data (avoid duplicates)
      const existing = this.getAllApplications();
      const existingUrls = new Set(existing.map(app => app.url));

      const newApplications = applications.filter(app => !existingUrls.has(app.url));
      const merged = [...existing, ...newApplications];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Calculate statistics
  static getStatistics(): ApplicationStats {
    const applications = this.getAllApplications();

    // Initialize counters
    const byStatus: Record<ApplicationStatus, number> = {} as Record<ApplicationStatus, number>;
    const byPlatform: Record<JobPlatform, number> = {} as Record<JobPlatform, number>;
    const byWorkEnvironment: Record<WorkEnvironment, number> = {} as Record<WorkEnvironment, number>;
    const byWorkType: Record<WorkType, number> = {} as Record<WorkType, number>;

    // Count applications by various dimensions
    let totalResponses = 0;
    let totalResponseTime = 0;
    let responseCount = 0;

    applications.forEach(app => {
      // Status
      const latestStatus = app.statusUpdates.length > 0 && app.statusUpdates[app.statusUpdates.length - 1].nextStep
        ? app.statusUpdates[app.statusUpdates.length - 1].nextStep!
        : ApplicationStatus.Applied;
      byStatus[latestStatus] = (byStatus[latestStatus] || 0) + 1;

      // Platform
      byPlatform[app.parsedData.platform] = (byPlatform[app.parsedData.platform] || 0) + 1;

      // Work environment
      byWorkEnvironment[app.parsedData.workEnvironment] = (byWorkEnvironment[app.parsedData.workEnvironment] || 0) + 1;

      // Work type
      byWorkType[app.parsedData.workType] = (byWorkType[app.parsedData.workType] || 0) + 1;

      // Response rate and time
      if (app.statusUpdates.length > 0 && app.statusUpdates[0].heardBack) {
        totalResponses++;
        const responseDate = new Date(app.statusUpdates[0].date);
        const applicationDate = new Date(app.applicationDate);
        const daysDiff = Math.floor((responseDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24));
        totalResponseTime += daysDiff;
        responseCount++;
      }
    });

    // Applications over time (grouped by week)
    const applicationsOverTime = this.groupApplicationsByWeek(applications);

    // Compensation ranges
    const compensationRanges = this.groupByCompensationRange(applications);

    return {
      total: applications.length,
      byStatus,
      byPlatform,
      byWorkEnvironment,
      byWorkType,
      responseRate: applications.length > 0 ? (totalResponses / applications.length) * 100 : 0,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      applicationsOverTime,
      compensationRanges,
    };
  }

  // Helper: Group applications by week
  private static groupApplicationsByWeek(applications: JobApplication[]): { date: string; count: number }[] {
    const weekMap = new Map<string, number>();

    applications.forEach(app => {
      const date = new Date(app.applicationDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
    });

    return Array.from(weekMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Helper: Group by compensation range
  private static groupByCompensationRange(applications: JobApplication[]): { range: string; count: number }[] {
    const ranges = [
      { label: '<$50k', min: 0, max: 50000 },
      { label: '$50k-$75k', min: 50000, max: 75000 },
      { label: '$75k-$100k', min: 75000, max: 100000 },
      { label: '$100k-$150k', min: 100000, max: 150000 },
      { label: '$150k+', min: 150000, max: Infinity },
    ];

    const rangeCounts = ranges.map(range => ({
      range: range.label,
      count: 0,
    }));

    applications.forEach(app => {
      const comp = app.parsedData.compensation;
      if (comp && comp.period === 'annual') {
        const avgComp = comp.min && comp.max ? (comp.min + comp.max) / 2 : comp.min || comp.max || 0;

        const rangeIndex = ranges.findIndex(r => avgComp >= r.min && avgComp < r.max);
        if (rangeIndex !== -1) {
          rangeCounts[rangeIndex].count++;
        }
      }
    });

    return rangeCounts.filter(rc => rc.count > 0);
  }

  // Clear all data (use with caution!)
  static clearAllData(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Export to CSV
  static exportToCSV(): void {
    try {
      console.log('Starting CSV export...');
      const applications = this.getAllApplications();
      console.log(`Found ${applications.length} applications to export`);

      if (applications.length === 0) {
        alert('No job applications to export');
        return;
      }

    // CSV Headers
    const headers = [
      'Application Date',
      'Job Title',
      'Company',
      'Location',
      'Platform',
      'Work Environment',
      'Work Type',
      'Current Status',
      'Min Salary',
      'Max Salary',
      'Currency',
      'Salary Period',
      'Job URL',
      'Total Updates',
      'User Notes',
      'Benefits',
      'Description Summary'
    ];

    // Convert applications to CSV rows
    const rows = applications.map(app => {
      const latestStatus = app.statusUpdates.length > 0 && app.statusUpdates[app.statusUpdates.length - 1].nextStep
        ? app.statusUpdates[app.statusUpdates.length - 1].nextStep
        : ApplicationStatus.Applied;

      return [
        new Date(app.applicationDate).toLocaleDateString(),
        `"${(app.parsedData.title || '').replace(/"/g, '""')}"`,
        `"${(app.parsedData.company || '').replace(/"/g, '""')}"`,
        `"${(app.parsedData.location || '').replace(/"/g, '""')}"`,
        app.parsedData.platform || '',
        app.parsedData.workEnvironment || '',
        app.parsedData.workType || '',
        latestStatus,
        app.parsedData.compensation?.min || '',
        app.parsedData.compensation?.max || '',
        app.parsedData.compensation?.currency || '',
        app.parsedData.compensation?.period || '',
        app.url || '',
        app.statusUpdates.length,
        `"${(app.userNotes || '').replace(/"/g, '""')}"`,
        `"${(app.parsedData.benefits || []).join(', ').replace(/"/g, '""')}"`,
        `"${(app.parsedData.descriptionSummary || '').replace(/"/g, '""')}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

      // Create blob and download
      console.log('Creating CSV file...');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const filename = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Successfully exported ${applications.length} applications to ${filename}`);
      alert(`Successfully exported ${applications.length} job applications!`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Initialize on load
StorageService.initialize();
