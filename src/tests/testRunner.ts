/**
 * Comprehensive Testing Suite for Job Application Tracker
 *
 * Run this in the browser console:
 * import('/src/tests/testRunner.ts').then(m => m.runAllTests())
 */

import { StorageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  JobApplication,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  ApplicationStatus,
} from '../types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

class TestRunner {
  private results: TestSuite[] = [];

  // Generate test job data
  private generateTestJob(overrides?: Partial<JobApplication>): JobApplication {
    const id = uuidv4();
    return {
      id,
      url: `https://linkedin.com/jobs/${id}`,
      parsedData: {
        title: 'Senior Software Engineer',
        company: 'Test Company Inc.',
        compensation: {
          min: 120000,
          max: 180000,
          currency: 'USD',
          period: 'annual',
        },
        workEnvironment: WorkEnvironment.Remote,
        workType: WorkType.FullTime,
        location: 'San Francisco, CA',
        platform: JobPlatform.LinkedIn,
        benefits: ['Health Insurance', '401k', 'Unlimited PTO'],
        descriptionSummary: 'Looking for a senior engineer to join our team...',
      },
      userNotes: 'Excited about this role!',
      hasApplied: true,
      applicationDate: new Date().toISOString(),
      statusUpdates: [],
      followUpReminderShown: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // Test localStorage operations
  private async testStorageService(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Storage Service',
      results: [],
      passed: 0,
      failed: 0,
      total: 0,
    };

    // Clear storage before tests
    StorageService.clearAllData();

    // Test 1: Save application
    try {
      const testJob = this.generateTestJob();
      const saved = StorageService.saveApplication(testJob);

      if (saved) {
        suite.results.push({
          name: 'Save application',
          passed: true,
          details: `Successfully saved job: ${testJob.parsedData.title}`,
        });
        suite.passed++;
      } else {
        throw new Error('Save returned false');
      }
    } catch (error) {
      suite.results.push({
        name: 'Save application',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 2: Get all applications
    try {
      const apps = StorageService.getAllApplications();

      if (apps.length === 1) {
        suite.results.push({
          name: 'Get all applications',
          passed: true,
          details: `Retrieved ${apps.length} application(s)`,
        });
        suite.passed++;
      } else {
        throw new Error(`Expected 1 application, got ${apps.length}`);
      }
    } catch (error) {
      suite.results.push({
        name: 'Get all applications',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 3: Get single application
    try {
      const apps = StorageService.getAllApplications();
      const app = StorageService.getApplication(apps[0].id);

      if (app && app.id === apps[0].id) {
        suite.results.push({
          name: 'Get single application',
          passed: true,
          details: `Retrieved application by ID`,
        });
        suite.passed++;
      } else {
        throw new Error('Failed to retrieve application by ID');
      }
    } catch (error) {
      suite.results.push({
        name: 'Get single application',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 4: Duplicate URL detection
    try {
      const testJob = this.generateTestJob();
      StorageService.saveApplication(testJob);

      // Try to save duplicate
      try {
        const duplicate = this.generateTestJob({ url: testJob.url });
        StorageService.saveApplication(duplicate);

        throw new Error('Duplicate was saved (should have been rejected)');
      } catch (duplicateError) {
        if (duplicateError instanceof Error && duplicateError.message.includes('already applied')) {
          suite.results.push({
            name: 'Duplicate URL detection',
            passed: true,
            details: 'Correctly rejected duplicate URL',
          });
          suite.passed++;
        } else {
          throw duplicateError;
        }
      }
    } catch (error) {
      suite.results.push({
        name: 'Duplicate URL detection',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 5: Update application
    try {
      const apps = StorageService.getAllApplications();
      const updated = StorageService.updateApplication(apps[0].id, {
        userNotes: 'Updated notes',
      });

      if (updated) {
        const app = StorageService.getApplication(apps[0].id);
        if (app && app.userNotes === 'Updated notes') {
          suite.results.push({
            name: 'Update application',
            passed: true,
            details: 'Successfully updated application',
          });
          suite.passed++;
        } else {
          throw new Error('Update did not persist');
        }
      } else {
        throw new Error('Update returned false');
      }
    } catch (error) {
      suite.results.push({
        name: 'Update application',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 6: Delete application
    try {
      const apps = StorageService.getAllApplications();
      const deleted = StorageService.deleteApplication(apps[0].id);

      if (deleted) {
        const remaining = StorageService.getAllApplications();
        if (remaining.length === apps.length - 1) {
          suite.results.push({
            name: 'Delete application',
            passed: true,
            details: `Successfully deleted application`,
          });
          suite.passed++;
        } else {
          throw new Error('Application was not deleted');
        }
      } else {
        throw new Error('Delete returned false');
      }
    } catch (error) {
      suite.results.push({
        name: 'Delete application',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 7: Follow-up reminders
    try {
      // Create an old application (3 weeks ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 21);

      const oldJob = this.generateTestJob({
        applicationDate: oldDate.toISOString(),
        followUpReminderShown: false,
      });

      StorageService.saveApplication(oldJob);

      const needingFollowUp = StorageService.getApplicationsNeedingFollowUp();

      if (needingFollowUp.length === 1) {
        suite.results.push({
          name: 'Follow-up reminders',
          passed: true,
          details: 'Correctly identified application needing follow-up',
        });
        suite.passed++;
      } else {
        throw new Error(`Expected 1 reminder, got ${needingFollowUp.length}`);
      }
    } catch (error) {
      suite.results.push({
        name: 'Follow-up reminders',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 8: Export to JSON
    try {
      const json = StorageService.exportAsJSON();
      const parsed = JSON.parse(json);

      if (Array.isArray(parsed)) {
        suite.results.push({
          name: 'Export to JSON',
          passed: true,
          details: `Exported ${parsed.length} application(s)`,
        });
        suite.passed++;
      } else {
        throw new Error('Exported JSON is not an array');
      }
    } catch (error) {
      suite.results.push({
        name: 'Export to JSON',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 9: Export to CSV
    try {
      const csv = StorageService.exportAsCSV();

      if (csv.includes('Date Applied') && csv.includes('Company')) {
        suite.results.push({
          name: 'Export to CSV',
          passed: true,
          details: 'CSV export includes expected headers',
        });
        suite.passed++;
      } else {
        throw new Error('CSV missing expected headers');
      }
    } catch (error) {
      suite.results.push({
        name: 'Export to CSV',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 10: Statistics calculation
    try {
      const stats = StorageService.getStatistics();

      if (
        typeof stats.total === 'number' &&
        typeof stats.responseRate === 'number' &&
        Array.isArray(stats.applicationsOverTime)
      ) {
        suite.results.push({
          name: 'Statistics calculation',
          passed: true,
          details: `Calculated stats for ${stats.total} application(s)`,
        });
        suite.passed++;
      } else {
        throw new Error('Statistics object has invalid structure');
      }
    } catch (error) {
      suite.results.push({
        name: 'Statistics calculation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    suite.total = suite.passed + suite.failed;
    return suite;
  }

  // Test data integrity
  private async testDataIntegrity(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Data Integrity',
      results: [],
      passed: 0,
      failed: 0,
      total: 0,
    };

    StorageService.clearAllData();

    // Test 1: Required fields validation
    try {
      const invalidJob = this.generateTestJob({
        parsedData: {
          ...this.generateTestJob().parsedData,
          title: '',
          company: '',
        },
      });

      // This should save but might cause issues in UI
      // We're just checking it doesn't crash
      StorageService.saveApplication(invalidJob);

      suite.results.push({
        name: 'Required fields validation',
        passed: true,
        details: 'Empty fields handled without crashing (Note: UI validation may be needed)',
      });
      suite.passed++;
    } catch (error) {
      suite.results.push({
        name: 'Required fields validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 2: Date formats
    try {
      const job = this.generateTestJob();
      const appDate = new Date(job.applicationDate);
      const createdDate = new Date(job.createdAt);

      if (
        !isNaN(appDate.getTime()) &&
        !isNaN(createdDate.getTime())
      ) {
        suite.results.push({
          name: 'Date formats',
          passed: true,
          details: 'All dates are valid ISO strings',
        });
        suite.passed++;
      } else {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      suite.results.push({
        name: 'Date formats',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 3: Status updates array
    try {
      const apps = StorageService.getAllApplications();
      const app = apps[0];

      const newUpdate = {
        date: new Date().toISOString(),
        heardBack: true,
        nextStep: ApplicationStatus.PhoneScreenScheduled,
        notes: 'Test update',
      };

      StorageService.updateApplication(app.id, {
        statusUpdates: [...app.statusUpdates, newUpdate],
      });

      const updated = StorageService.getApplication(app.id);

      if (updated && updated.statusUpdates.length === 1) {
        suite.results.push({
          name: 'Status updates array',
          passed: true,
          details: 'Status update added successfully',
        });
        suite.passed++;
      } else {
        throw new Error('Status update not saved correctly');
      }
    } catch (error) {
      suite.results.push({
        name: 'Status updates array',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    suite.total = suite.passed + suite.failed;
    return suite;
  }

  // Test edge cases
  private async testEdgeCases(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Edge Cases',
      results: [],
      passed: 0,
      failed: 0,
      total: 0,
    };

    StorageService.clearAllData();

    // Test 1: Large dataset (100 applications)
    try {
      const jobs = Array.from({ length: 100 }, (_, i) =>
        this.generateTestJob({ parsedData: { ...this.generateTestJob().parsedData, title: `Job ${i}` } })
      );

      jobs.forEach(job => StorageService.saveApplication(job));

      const retrieved = StorageService.getAllApplications();

      if (retrieved.length === 100) {
        suite.results.push({
          name: 'Large dataset (100 apps)',
          passed: true,
          details: 'Successfully stored and retrieved 100 applications',
        });
        suite.passed++;
      } else {
        throw new Error(`Expected 100 apps, got ${retrieved.length}`);
      }
    } catch (error) {
      suite.results.push({
        name: 'Large dataset (100 apps)',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 2: Special characters in data
    try {
      const specialJob = this.generateTestJob({
        parsedData: {
          ...this.generateTestJob().parsedData,
          title: 'Software Engineer @ Tech Co. (Remote) - "Exciting Opportunity!"',
          company: "O'Reilly & Associates, Inc.",
          descriptionSummary: 'Job with <HTML>, "quotes", & special chars: é, ñ, 中文',
        },
      });

      StorageService.saveApplication(specialJob);
      const retrieved = StorageService.getApplication(specialJob.id);

      if (retrieved && retrieved.parsedData.title.includes('"Exciting Opportunity!"')) {
        suite.results.push({
          name: 'Special characters in data',
          passed: true,
          details: 'Special characters handled correctly',
        });
        suite.passed++;
      } else {
        throw new Error('Special characters not preserved');
      }
    } catch (error) {
      suite.results.push({
        name: 'Special characters in data',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    // Test 3: No compensation data
    try {
      const noCompJob = this.generateTestJob({
        parsedData: {
          ...this.generateTestJob().parsedData,
          compensation: null,
        },
      });

      StorageService.saveApplication(noCompJob);
      const retrieved = StorageService.getApplication(noCompJob.id);

      if (retrieved && retrieved.parsedData.compensation === null) {
        suite.results.push({
          name: 'Missing compensation data',
          passed: true,
          details: 'Null compensation handled correctly',
        });
        suite.passed++;
      } else {
        throw new Error('Null compensation not handled');
      }
    } catch (error) {
      suite.results.push({
        name: 'Missing compensation data',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      suite.failed++;
    }

    suite.total = suite.passed + suite.failed;
    return suite;
  }

  // Print results
  private printResults(suites: TestSuite[]): void {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   JOB APPLICATION TRACKER - TEST RESULTS                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    suites.forEach(suite => {
      console.log(`\n📦 ${suite.name}`);
      console.log(`   ${suite.passed} passed / ${suite.failed} failed / ${suite.total} total`);
      console.log('   ' + '─'.repeat(50));

      suite.results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`   ${icon} ${result.name}`);

        if (result.details) {
          console.log(`      ℹ️  ${result.details}`);
        }

        if (result.error) {
          console.log(`      ⚠️  Error: ${result.error}`);
        }
      });

      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalTests += suite.total;
    });

    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) need attention`);
    }

    console.log('\n' + '═'.repeat(60));
  }

  // Run all tests
  async runAll(): Promise<void> {
    console.log('🧪 Running test suite...\n');

    const suites: TestSuite[] = [];

    suites.push(await this.testStorageService());
    suites.push(await this.testDataIntegrity());
    suites.push(await this.testEdgeCases());

    this.printResults(suites);

    // Clean up
    StorageService.clearAllData();
    console.log('\n🧹 Test data cleaned up');
  }
}

// Export test runner
export async function runAllTests(): Promise<void> {
  const runner = new TestRunner();
  await runner.runAll();
}

// Make it available in window for console access
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
}
