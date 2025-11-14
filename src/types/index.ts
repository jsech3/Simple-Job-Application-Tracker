// Enums for specific fields
export enum WorkEnvironment {
  Remote = 'Remote',
  Hybrid = 'Hybrid',
  InOffice = 'In-Office',
  NotSpecified = 'Not Specified',
}

export enum WorkType {
  FullTime = 'Full-time',
  PartTime = 'Part-time',
  Contract = 'Contract',
  Internship = 'Internship',
  NotSpecified = 'Not Specified',
}

export enum ApplicationStatus {
  Applied = 'Applied',
  PhoneScreenScheduled = 'Phone Screen Scheduled',
  PhoneScreenCompleted = 'Phone Screen Completed',
  TechnicalInterview = 'Technical Interview',
  FinalInterview = 'Final Interview',
  OfferReceived = 'Offer Received',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn',
}

export enum JobPlatform {
  LinkedIn = 'LinkedIn',
  Indeed = 'Indeed',
  ZipRecruiter = 'ZipRecruiter',
  Glassdoor = 'Glassdoor',
  CompanyWebsite = 'Company Website',
  Other = 'Other',
}

// Compensation interface
export interface Compensation {
  min?: number;
  max?: number;
  currency: string;
  period: 'annual' | 'hourly';
}

// Parsed data from job posting
export interface ParsedJobData {
  title: string;
  company: string;
  compensation: Compensation | null;
  workEnvironment: WorkEnvironment;
  workType: WorkType;
  location: string;
  platform: JobPlatform;
  benefits: string[];
  descriptionSummary: string;
  tags: string[]; // AI-generated tags for categorization
  confidence?: {
    title?: number;
    company?: number;
    workEnvironment?: number;
    workType?: number;
  };
}

// Status update entry
export interface StatusUpdate {
  date: string; // ISO timestamp
  heardBack: boolean;
  nextStep?: ApplicationStatus;
  notes?: string;
}

// Main job application interface
export interface JobApplication {
  id: string; // UUID
  url: string;
  parsedData: ParsedJobData;
  userNotes: string;
  hasApplied: boolean;
  applicationDate: string; // ISO timestamp
  statusUpdates: StatusUpdate[];
  followUpReminderShown: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Response from Claude API for job parsing
export interface JobParseResponse {
  success: boolean;
  data?: ParsedJobData;
  error?: string;
}

// Response from Claude API for email generation
export interface EmailGenerationResponse {
  success: boolean;
  email?: {
    subject: string;
    body: string;
  };
  error?: string;
}

// Filter options for dashboard
export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: ApplicationStatus[];
  compensationRange?: {
    min: number;
    max: number;
  };
  location?: string[];
  workType?: WorkType[];
  workEnvironment?: WorkEnvironment[];
  platform?: JobPlatform[];
}

// Statistics for data visualization
export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byPlatform: Record<JobPlatform, number>;
  byWorkEnvironment: Record<WorkEnvironment, number>;
  byWorkType: Record<WorkType, number>;
  responseRate: number;
  averageResponseTime: number; // in days
  applicationsOverTime: {
    date: string;
    count: number;
  }[];
  compensationRanges: {
    range: string;
    count: number;
  }[];
}
