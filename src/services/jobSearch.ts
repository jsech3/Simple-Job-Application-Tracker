/**
 * JSearch API client — searches aggregated job boards (LinkedIn, Indeed,
 * Glassdoor, ZipRecruiter) via RapidAPI and normalizes results into the
 * app's {@link SearchResult} shape.
 *
 * @module jobSearch
 *
 * ## Setup
 * Set `VITE_JSEARCH_API_KEY` in your `.env` file with a valid RapidAPI key
 * subscribed to the JSearch API (free tier = 200 req/month).
 *
 * ## Exports
 * - {@link searchJobs} — run a search with filters, returns normalized results.
 * - {@link normalizeJSearchJob} — convert a raw JSearch job object to {@link SearchResult}.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SearchResult,
  JobSearchFilters,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  Compensation,
} from '../types';

const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

/** Reads the JSearch API key from the Vite environment. Throws if missing. */
const getJSearchApiKey = (): string => {
  const apiKey = import.meta.env.VITE_JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_JSEARCH_API_KEY environment variable is not set. Add it to your .env file.');
  }
  return apiKey;
};

/** Raw job object shape returned by the JSearch `/search` endpoint. */
interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_is_remote: boolean;
  job_employment_type: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_publisher: string;
}

/** Top-level JSearch API response envelope. */
interface JSearchResponse {
  status: string;
  data: JSearchJob[];
  parameters?: Record<string, string>;
}

/** Map JSearch `job_publisher` string to the app's {@link JobPlatform} enum. */
const detectPlatformFromPublisher = (publisher: string): JobPlatform => {
  const pub = publisher.toLowerCase();
  if (pub.includes('linkedin')) return JobPlatform.LinkedIn;
  if (pub.includes('indeed')) return JobPlatform.Indeed;
  if (pub.includes('ziprecruiter')) return JobPlatform.ZipRecruiter;
  if (pub.includes('glassdoor')) return JobPlatform.Glassdoor;
  return JobPlatform.Other;
};

/** Map JSearch `job_employment_type` string to the app's {@link WorkType} enum. */
const mapEmploymentType = (type: string): WorkType => {
  const t = type?.toUpperCase() || '';
  if (t.includes('FULLTIME') || t.includes('FULL_TIME') || t.includes('FULL-TIME')) return WorkType.FullTime;
  if (t.includes('PARTTIME') || t.includes('PART_TIME') || t.includes('PART-TIME')) return WorkType.PartTime;
  if (t.includes('CONTRACT') || t.includes('CONTRACTOR')) return WorkType.Contract;
  if (t.includes('INTERN')) return WorkType.Internship;
  return WorkType.NotSpecified;
};

/** Extract and normalize salary data from a JSearch job into {@link Compensation}. */
const normalizeCompensation = (job: JSearchJob): Compensation | null => {
  if (!job.job_min_salary && !job.job_max_salary) return null;

  const period = job.job_salary_period?.toLowerCase();
  let salaryPeriod: 'annual' | 'hourly' = 'annual';
  if (period === 'hour' || period === 'hourly') {
    salaryPeriod = 'hourly';
  }

  return {
    min: job.job_min_salary ?? undefined,
    max: job.job_max_salary ?? undefined,
    currency: job.job_salary_currency || 'USD',
    period: salaryPeriod,
  };
};

/**
 * Convert a raw JSearch API job object into the app's {@link SearchResult} shape.
 * Generates a new UUID for each result and maps all fields to the internal enums.
 */
export const normalizeJSearchJob = (job: JSearchJob): SearchResult => {
  const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  const location = locationParts.join(', ') || 'Not specified';

  let workEnvironment = WorkEnvironment.NotSpecified;
  if (job.job_is_remote) {
    workEnvironment = WorkEnvironment.Remote;
  }

  return {
    id: uuidv4(),
    source: 'jsearch',
    title: job.job_title,
    company: job.employer_name,
    location,
    compensation: normalizeCompensation(job),
    workEnvironment,
    workType: mapEmploymentType(job.job_employment_type),
    platform: detectPlatformFromPublisher(job.job_publisher),
    description: job.job_description || '',
    url: job.job_apply_link || '',
    tags: [],
    benefits: job.job_highlights?.Benefits || [],
    imported: false,
  };
};

/**
 * Search for jobs via the JSearch (RapidAPI) endpoint.
 *
 * Builds query params from {@link JobSearchFilters}, calls the API, and
 * normalizes every result into a {@link SearchResult}.
 *
 * @throws If the API key is missing or the API returns a non-OK status.
 */
export const searchJobs = async (filters: JobSearchFilters): Promise<{
  results: SearchResult[];
  totalCount: number;
}> => {
  const apiKey = getJSearchApiKey();

  const params = new URLSearchParams({
    query: filters.query + (filters.location ? ` in ${filters.location}` : ''),
    page: String(filters.page),
    num_pages: '1',
  });

  if (filters.remoteOnly) {
    params.set('remote_jobs_only', 'true');
  }

  if (filters.datePosted && filters.datePosted !== 'all') {
    const dateMap: Record<string, string> = {
      today: 'today',
      '3days': '3days',
      week: 'week',
      month: 'month',
    };
    params.set('date_posted', dateMap[filters.datePosted] || 'all');
  }

  if (filters.workType) {
    const typeMap: Record<string, string> = {
      'Full-time': 'FULLTIME',
      'Part-time': 'PARTTIME',
      'Contract': 'CONTRACTOR',
      'Internship': 'INTERN',
    };
    const mapped = typeMap[filters.workType];
    if (mapped) {
      params.set('employment_types', mapped);
    }
  }

  const response = await fetch(
    `https://${JSEARCH_API_HOST}/search?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${errorText}`);
  }

  const data: JSearchResponse = await response.json();

  if (data.status !== 'OK' || !data.data) {
    return { results: [], totalCount: 0 };
  }

  const results = data.data.map(normalizeJSearchJob);

  return {
    results,
    totalCount: results.length,
  };
};
