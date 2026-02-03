/**
 * Hacker News "Who is hiring?" search client.
 *
 * Fetches the monthly hiring threads from Hacker News via the Algolia API,
 * parses individual job comments, and normalizes them into {@link SearchResult}
 * objects. Ported from the Python `tpm_job_hunter.py` scraper.
 *
 * No API key required — the Algolia HN API is free and public.
 *
 * @module hnSearch
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SearchResult,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  Compensation,
} from '../types';

// ─── Algolia HN API types ──────────────────────────────────────────────

interface AlgoliaStory {
  objectID: string;
  title: string;
  created_at: string;
}

interface AlgoliaItem {
  id: number;
  text?: string | null;
  created_at?: string | null;
  children?: AlgoliaItem[];
}

// ─── Filter options exposed to the UI ──────────────────────────────────

export type HNRoleCategory = 'all' | 'product' | 'analyst' | 'data_eng' | 'engineering' | 'design';

export interface HNSearchFilters {
  /** Which role categories to include. 'all' disables role filtering. */
  roleCategory: HNRoleCategory;
  /** Require at least one tech keyword (SaaS, data, cloud, etc.) */
  requireTech: boolean;
  /** Require remote / SF / Bay Area location mention */
  requireLocation: boolean;
  /** Minimum annual salary in USD (0 = no filter) */
  minSalary: number;
  /** How many days back to search (default 30) */
  daysBack: number;
  /** Free-text keyword filter applied after fetching */
  keyword: string;
}

export const defaultHNFilters: HNSearchFilters = {
  roleCategory: 'all',
  requireTech: false,
  requireLocation: false,
  minSalary: 0,
  daysBack: 30,
  keyword: '',
};

// ─── Text helpers ──────────────────────────────────────────────────────

export function normalizeText(raw: string): string {
  let text = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

/** Extract the first line as "title" (usually "Company | Role | Location | ...") */
export function extractTitle(text: string): { company: string; title: string; location: string } {
  const firstLine = text.split(/[.\n]/).filter(Boolean)[0] || text;
  // HN posts often use " | " as separator: "Company | Role | Location | Salary"
  const parts = firstLine.split(/\s*[|]\s*/);

  if (parts.length >= 3) {
    return { company: parts[0].trim(), title: parts[1].trim(), location: parts[2].trim() };
  }
  if (parts.length === 2) {
    return { company: parts[0].trim(), title: parts[1].trim(), location: '' };
  }
  // Fallback: try " - " separator
  const dashParts = firstLine.split(/\s*[-–—]\s*/);
  if (dashParts.length >= 2) {
    return { company: dashParts[0].trim(), title: dashParts[1].trim(), location: dashParts[2]?.trim() || '' };
  }
  return { company: firstLine.substring(0, 60).trim(), title: 'Unknown Role', location: '' };
}

// ─── Salary extraction (ported from Python) ────────────────────────────

export function extractSalaryBounds(text: string): { min: number | null; max: number | null } {
  const t = text.toLowerCase();

  // Skip equity-only mentions
  if (t.includes('equity') && !t.includes('$') && !t.includes('k')) {
    return { min: null, max: null };
  }

  const amounts: number[] = [];

  // Match "$120k", "$120,000", "$120K"
  const dollarPattern = /\$\s*([0-9]{2,3}(?:,[0-9]{3})+|[0-9]{2,3})(?:\s*(k))?/gi;
  let m;
  while ((m = dollarPattern.exec(t)) !== null) {
    let val = parseInt(m[1].replace(/,/g, ''), 10);
    if (m[2]?.toLowerCase() === 'k') val *= 1000;
    if (val >= 15000 && val <= 2000000) amounts.push(val);
  }

  // Match bare "120k", "150K"
  const bareKPattern = /\b([0-9]{2,3})\s*k\b/gi;
  while ((m = bareKPattern.exec(t)) !== null) {
    const val = parseInt(m[1], 10) * 1000;
    if (val >= 15000 && val <= 2000000) amounts.push(val);
  }

  if (amounts.length === 0) return { min: null, max: null };
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

// ─── Role classification (ported from Python) ──────────────────────────

export function classifyRole(text: string): string {
  const t = text.toLowerCase();

  const sweExclude = [
    'software engineer', 'swe', 'backend engineer', 'front end engineer',
    'frontend engineer', 'full stack', 'full-stack', 'devops',
    'site reliability', 'sre', 'platform engineer', 'mobile engineer',
    'ios engineer', 'android engineer',
  ];

  const productKw = [
    'product manager', 'product management', 'product owner',
    'product lead', 'technical product', 'tpm',
  ];
  const analystKw = [
    'data analyst', 'business analyst', 'analytics', 'bi analyst',
    'business intelligence', 'product analyst', 'marketing analyst',
    'operations analyst',
  ];
  const dataEngKw = [
    'data engineer', 'analytics engineer', 'data engineering',
    'data pipeline', 'data pipelines', 'airflow', 'dagster', 'dbt',
    'elt', 'etl', 'data warehousing', 'data warehouse',
  ];
  const engineeringKw = [
    'software engineer', 'swe', 'backend', 'frontend', 'full stack',
    'full-stack', 'devops', 'sre', 'mobile engineer', 'engineer',
  ];
  const designKw = [
    'designer', 'design lead', 'ux', 'ui', 'product design',
    'design system', 'visual design',
  ];

  // If generic SWE and doesn't mention target tracks, classify for the engineering bucket
  if (sweExclude.some(k => t.includes(k))) {
    if (!productKw.some(k => t.includes(k)) &&
        !analystKw.some(k => t.includes(k)) &&
        !dataEngKw.some(k => t.includes(k)) &&
        !/\b(pm|tpm)\b/.test(t)) {
      return 'engineering';
    }
  }

  if (dataEngKw.some(k => t.includes(k))) return 'data_eng';
  if (analystKw.some(k => t.includes(k))) return 'analyst';
  if (productKw.some(k => t.includes(k)) || /\b(pm|tpm)\b/.test(t)) return 'product';
  if (designKw.some(k => t.includes(k))) return 'design';
  if (engineeringKw.some(k => t.includes(k))) return 'engineering';

  return 'other';
}

// ─── Work environment detection ────────────────────────────────────────

export function detectWorkEnvironment(text: string): WorkEnvironment {
  const t = text.toLowerCase();
  if (/\b(remote|wfh|work from home|anywhere)\b/.test(t)) return WorkEnvironment.Remote;
  if (/\bhybrid\b/.test(t)) return WorkEnvironment.Hybrid;
  if (/\b(on-?site|in-?office|in person)\b/.test(t)) return WorkEnvironment.InOffice;
  return WorkEnvironment.NotSpecified;
}

// ─── Tag extraction ────────────────────────────────────────────────────

export function extractTags(text: string, roleCategory: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];

  // Role tag
  const roleMap: Record<string, string> = {
    product: 'Product', analyst: 'Analyst', data_eng: 'Data Eng',
    engineering: 'Engineering', design: 'Design',
  };
  if (roleMap[roleCategory]) tags.push(roleMap[roleCategory]);

  // Tech tags
  const techTags: [string, string][] = [
    ['react', 'React'], ['typescript', 'TypeScript'], ['python', 'Python'],
    ['sql', 'SQL'], ['aws', 'AWS'], ['gcp', 'GCP'], ['azure', 'Azure'],
    ['kubernetes', 'K8s'], ['docker', 'Docker'], ['node', 'Node.js'],
    ['rust', 'Rust'], ['go ', 'Go'], ['golang', 'Go'],
    ['snowflake', 'Snowflake'], ['bigquery', 'BigQuery'], ['dbt', 'dbt'],
    ['airflow', 'Airflow'], ['spark', 'Spark'], ['kafka', 'Kafka'],
    ['machine learning', 'ML'], [' ai ', 'AI'], ['llm', 'LLM'],
  ];
  for (const [kw, tag] of techTags) {
    if (t.includes(kw) && !tags.includes(tag)) tags.push(tag);
  }

  return tags.slice(0, 8);
}

// ─── Main search function ──────────────────────────────────────────────

/**
 * Search Hacker News "Who is hiring?" threads.
 *
 * 1. Fetches recent hiring stories from the Algolia HN API
 * 2. Fetches all top-level comments (individual job posts)
 * 3. Applies role, tech, location, and salary filters
 * 4. Normalizes results to SearchResult[]
 */
export async function searchHN(filters: HNSearchFilters): Promise<SearchResult[]> {
  const dateCutoff = Math.floor((Date.now() - filters.daysBack * 86400000) / 1000);

  // 1. Find recent "Who is hiring" stories
  const storiesUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent('Ask HN: Who is hiring')}&tags=story&numericFilters=created_at_i>${dateCutoff}&hitsPerPage=10`;

  const storiesResp = await fetch(storiesUrl);
  if (!storiesResp.ok) throw new Error(`HN API error: ${storiesResp.status}`);
  const storiesData = await storiesResp.json();
  const stories: AlgoliaStory[] = storiesData.hits || [];

  if (stories.length === 0) return [];

  // 2. Fetch comments from each story (parallel, max 3 concurrent)
  const allComments: { text: string; createdAt: string; id: number }[] = [];

  // Process stories sequentially to avoid rate limits, but limit to most recent 3
  for (const story of stories.slice(0, 3)) {
    try {
      const itemResp = await fetch(`https://hn.algolia.com/api/v1/items/${story.objectID}`);
      if (!itemResp.ok) continue;
      const itemData: AlgoliaItem = await itemResp.json();

      // Only top-level children (each is one company's job post)
      for (const child of itemData.children || []) {
        if (child.text) {
          allComments.push({
            text: child.text,
            createdAt: child.created_at || story.created_at,
            id: child.id,
          });
        }
      }
    } catch {
      continue;
    }
  }

  // 3. Filter and normalize
  const keywordLower = filters.keyword.toLowerCase().trim();

  const techKeywords = [
    'saas', 'software', 'platform', 'api', 'cloud', 'data', 'analytics',
    'ai', 'ml', 'machine learning', 'sql', 'python', 'snowflake',
    'bigquery', 'databricks', 'aws', 'gcp', 'azure',
  ];

  const locationKeywords = [
    'remote', 'work from home', 'wfh', 'anywhere',
    'san francisco', 'sf', 'bay area', 'new york', 'nyc',
  ];

  const results: SearchResult[] = [];

  for (const comment of allComments) {
    const cleaned = normalizeText(comment.text);
    const lower = cleaned.toLowerCase();

    // Keyword filter
    if (keywordLower && !lower.includes(keywordLower)) continue;

    // Role classification
    const role = classifyRole(lower);
    if (filters.roleCategory !== 'all' && role !== filters.roleCategory) continue;

    // Tech keyword gate
    if (filters.requireTech && !techKeywords.some(k => lower.includes(k))) continue;

    // Location gate
    if (filters.requireLocation && !locationKeywords.some(k => lower.includes(k))) continue;

    // Salary extraction & filter
    const salary = extractSalaryBounds(lower);
    if (filters.minSalary > 0 && salary.min !== null && salary.min < filters.minSalary) continue;

    // Build compensation object
    let compensation: Compensation | null = null;
    if (salary.min !== null || salary.max !== null) {
      compensation = {
        min: salary.min ?? undefined,
        max: salary.max ?? undefined,
        currency: 'USD',
        period: 'annual',
      };
    }

    const { company, title, location } = extractTitle(cleaned);
    const tags = extractTags(lower, role);
    const workEnv = detectWorkEnvironment(lower);

    // Description: use first 500 chars after the title line
    const descStart = cleaned.indexOf(title) + title.length;
    const description = cleaned.substring(descStart, descStart + 500).trim() || cleaned.substring(0, 500);

    results.push({
      id: uuidv4(),
      source: 'hn_search',
      title,
      company,
      location,
      compensation,
      workEnvironment: workEnv,
      workType: WorkType.FullTime,
      platform: JobPlatform.Other,
      description,
      url: `https://news.ycombinator.com/item?id=${comment.id}`,
      tags,
      benefits: [],
      imported: false,
    });
  }

  return results;
}
