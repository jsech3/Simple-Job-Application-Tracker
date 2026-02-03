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

// ─── Search-related types ────────────────────────────────────────────────────

/** Identifies which source a search result originated from. */
export type SearchSource = 'jsearch' | 'ai_suggestion' | 'manual_import' | 'hn_search';

/** Identifies which tab is active in the Job Search view. */
export type SearchTab = 'api_search' | 'ai_suggestions' | 'manual_import' | 'hn_search';

/**
 * A single job listing returned from any search source (JSearch API,
 * AI-generated query, or manual paste-and-parse).
 *
 * Held in React state only — **not** persisted to storage.
 * When the user imports a result it is converted to a {@link JobApplication}.
 */
export interface SearchResult {
  /** Unique ID (UUID v4) generated at normalization time. */
  id: string;
  /** Which pipeline produced this result. */
  source: SearchSource;
  title: string;
  company: string;
  location: string;
  compensation: Compensation | null;
  workEnvironment: WorkEnvironment;
  workType: WorkType;
  /** Original publishing platform (LinkedIn, Indeed, etc.). */
  platform: JobPlatform;
  /** Full or summarized job description text. */
  description: string;
  /** Direct apply / posting URL (may be empty for manual imports). */
  url: string;
  tags: string[];
  benefits: string[];
  /** Whether this result has already been imported into the tracker. */
  imported: boolean;
}

/**
 * Filter parameters sent to the JSearch API (and used by the SearchFilters UI).
 */
export interface JobSearchFilters {
  /** Keywords, job title, or skills to search for. */
  query: string;
  /** Geographic filter (city, state, country). */
  location: string;
  /** Empty string means "any". */
  workEnvironment: WorkEnvironment | '';
  /** Empty string means "any". */
  workType: WorkType | '';
  remoteOnly: boolean;
  /** How recently the job was posted. */
  datePosted: 'all' | 'today' | '3days' | 'week' | 'month';
  /** 1-based page number for pagination. */
  page: number;
  pageSize: number;
}

/**
 * Persisted user profile used by the AI Suggestions tab.
 *
 * Claude reads this profile to generate smart JSearch queries.
 * Stored under the `user_profile` localStorage / chrome.storage key.
 */
export interface UserProfile {
  skills: string[];
  desiredTitles: string[];
  preferredLocations: string[];
  workEnvironmentPreference: WorkEnvironment | '';
  workTypePreference: WorkType | '';
  /** Minimum acceptable annual salary (USD). */
  salaryMin: number | null;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | '';
  industries: string[];
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
