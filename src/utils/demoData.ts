import { v4 as uuidv4 } from 'uuid';
import { JobApplication, ApplicationStatus, WorkEnvironment, WorkType, JobPlatform } from '../types';

const DEMO_COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Tesla',
  'Airbnb', 'Uber', 'Stripe', 'Spotify', 'Dropbox', 'Slack', 'GitHub',
  'Twitter', 'LinkedIn', 'Adobe', 'Salesforce', 'Oracle', 'IBM'
];

const DEMO_ROLES = [
  'Senior Software Engineer', 'Frontend Developer', 'Backend Engineer',
  'Full Stack Developer', 'DevOps Engineer', 'Site Reliability Engineer',
  'Machine Learning Engineer', 'Data Scientist', 'Product Manager',
  'Engineering Manager', 'Staff Engineer', 'Principal Engineer'
];

const DEMO_LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Los Angeles, CA', 'Chicago, IL', 'Denver, CO',
  'Portland, OR', 'Remote - US', 'Remote - Global'
];

const DEMO_PLATFORMS = [
  'LinkedIn', 'Indeed', 'Company Website', 'AngelList', 'Hired',
  'Glassdoor', 'BuiltIn', 'RemoteOK', 'Wellfound'
];

const DEMO_NOTES = [
  'Really excited about this opportunity! The team seems great.',
  'Company culture looks amazing from reviews.',
  'Salary range is competitive.',
  'Talked to a current employee - very positive feedback.',
  'Great benefits package including unlimited PTO.',
  'Opportunity to work with cutting-edge tech.',
];

const DEMO_STATUS_UPDATES = [
  'Applied through company portal',
  'Received confirmation email',
  'Recruiter reached out for initial screening',
  'Completed phone screen with hiring manager',
  'Technical interview scheduled for next week',
  'Had a great conversation with the team',
  'Waiting to hear back on next steps',
];

/**
 * Generate a random date between start and end
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Get a random item from an array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a realistic demo job application
 */
export function generateDemoJob(index: number = 0): JobApplication {
  const company = randomItem(DEMO_COMPANIES);
  const title = randomItem(DEMO_ROLES);
  const location = randomItem(DEMO_LOCATIONS);
  const workEnv = randomItem(Object.values(WorkEnvironment));
  const workType = randomItem(Object.values(WorkType));
  const platform = randomItem(DEMO_PLATFORMS);

  // Random date in the last 60 days
  const applicationDate = randomDate(
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    new Date()
  );

  // Random compensation between 80k-300k
  const minSalary = Math.floor(Math.random() * 150 + 80) * 1000;
  const maxSalary = minSalary + Math.floor(Math.random() * 80 + 20) * 1000;

  // Random status
  const possibleStatuses = [
    ApplicationStatus.Applied,
    ApplicationStatus.PhoneScreenScheduled,
    ApplicationStatus.TechnicalInterview,
    ApplicationStatus.PhoneScreenCompleted,
    ApplicationStatus.FinalInterview,
    ApplicationStatus.OfferReceived,
    ApplicationStatus.Rejected,
  ];
  const currentStatus = randomItem(possibleStatuses);

  // Generate status updates based on current status
  const statusUpdates: JobApplication['statusUpdates'] = [];
  const statusOrder = [
    ApplicationStatus.Applied,
    ApplicationStatus.PhoneScreenScheduled,
    ApplicationStatus.TechnicalInterview,
    ApplicationStatus.PhoneScreenCompleted,
    ApplicationStatus.FinalInterview,
    ApplicationStatus.OfferReceived,
  ];

  const currentStatusIndex = statusOrder.indexOf(currentStatus);
  if (currentStatusIndex !== -1) {
    for (let i = 0; i <= currentStatusIndex && i < statusOrder.length; i++) {
      const updateDate = new Date(applicationDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      statusUpdates.push({
        date: updateDate.toISOString(),
        heardBack: i > 0,
        nextStep: statusOrder[i],
        notes: randomItem(DEMO_STATUS_UPDATES),
      });
    }
  } else if (currentStatus === ApplicationStatus.Rejected) {
    statusUpdates.push({
      date: new Date(applicationDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      heardBack: true,
      nextStep: ApplicationStatus.Rejected,
      notes: 'Received rejection email',
    });
  }

  // Map demo platform strings to JobPlatform enum
  const platformMap: Record<string, JobPlatform> = {
    'LinkedIn': JobPlatform.LinkedIn,
    'Indeed': JobPlatform.Indeed,
    'Company Website': JobPlatform.CompanyWebsite,
    'Glassdoor': JobPlatform.Glassdoor,
    'ZipRecruiter': JobPlatform.ZipRecruiter,
  };
  const jobPlatform = platformMap[platform] || JobPlatform.Other;

  const job: JobApplication = {
    id: uuidv4(),
    url: `https://www.${company.toLowerCase().replace(/\s/g, '')}.com/careers/${index}`,
    parsedData: {
      title,
      company,
      location,
      workEnvironment: workEnv,
      workType,
      compensation: {
        min: minSalary,
        max: maxSalary,
        currency: 'USD',
        period: 'annual',
      },
      platform: jobPlatform,
      benefits: [],
      descriptionSummary: `Exciting opportunity to join ${company} as a ${title}. Work with cutting-edge technology and talented engineers to build products used by millions.`,
      tags: [],
    },
    userNotes: Math.random() > 0.5 ? randomItem(DEMO_NOTES) : '',
    hasApplied: true,
    applicationDate: applicationDate.toISOString(),
    statusUpdates,
    followUpReminderShown: false,
    createdAt: applicationDate.toISOString(),
    updatedAt: applicationDate.toISOString(),
  };

  return job;
}

/**
 * Generate multiple demo jobs
 */
export function generateDemoJobs(count: number): JobApplication[] {
  const jobs: JobApplication[] = [];
  for (let i = 0; i < count; i++) {
    jobs.push(generateDemoJob(i));
  }
  return jobs;
}

/**
 * Generate a demo job that needs follow-up (applied >14 days ago, no updates)
 */
export function generateFollowUpDemoJob(): JobApplication {
  const job = generateDemoJob(999);

  // Set application date to 16 days ago
  const oldDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
  job.applicationDate = oldDate.toISOString();

  // Clear status updates except initial application
  job.statusUpdates = [{
    date: oldDate.toISOString(),
    heardBack: false,
    nextStep: ApplicationStatus.Applied,
    notes: 'Applied through company portal',
  }];

  job.followUpReminderShown = false;

  return job;
}
