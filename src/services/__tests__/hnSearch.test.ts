import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  extractTitle,
  extractSalaryBounds,
  classifyRole,
  detectWorkEnvironment,
  extractTags,
} from '../hnSearch';
import { WorkEnvironment } from '../../types';

// ─── normalizeText ──────────────────────────────────────────────────────

describe('normalizeText', () => {
  it('decodes HTML entities', () => {
    expect(normalizeText('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  it('decodes quote and slash entities', () => {
    expect(normalizeText('&quot;hello&#x27;s&#x2F;world&quot;')).toBe('"hello\'s/world"');
  });

  it('strips HTML tags', () => {
    expect(normalizeText('Hello <b>world</b> <a href="x">link</a>')).toBe('Hello world link');
  });

  it('normalizes whitespace', () => {
    expect(normalizeText('  too   many    spaces  ')).toBe('too many spaces');
  });

  it('handles combined HTML entities, tags, and whitespace', () => {
    expect(normalizeText('<p>Foo &amp; Bar</p>  <br>  Baz')).toBe('Foo & Bar Baz');
  });
});

// ─── extractTitle ───────────────────────────────────────────────────────

describe('extractTitle', () => {
  it('parses pipe-separated format (Company | Role | Location)', () => {
    const result = extractTitle('Acme Corp | Senior Engineer | San Francisco');
    expect(result).toEqual({
      company: 'Acme Corp',
      title: 'Senior Engineer',
      location: 'San Francisco',
    });
  });

  it('handles two-part pipe format', () => {
    const result = extractTitle('Acme Corp | Senior Engineer');
    expect(result).toEqual({
      company: 'Acme Corp',
      title: 'Senior Engineer',
      location: '',
    });
  });

  it('falls back to dash-separated format', () => {
    const result = extractTitle('Acme Corp - Senior Engineer - Remote');
    expect(result).toEqual({
      company: 'Acme Corp',
      title: 'Senior Engineer',
      location: 'Remote',
    });
  });

  it('falls back to single-value when no separator found', () => {
    const result = extractTitle('Some random job posting text here');
    expect(result.company).toBe('Some random job posting text here');
    expect(result.title).toBe('Unknown Role');
    expect(result.location).toBe('');
  });

  it('truncates long single-value company to 60 chars', () => {
    const long = 'A'.repeat(100);
    const result = extractTitle(long);
    expect(result.company.length).toBe(60);
  });
});

// ─── extractSalaryBounds ────────────────────────────────────────────────

describe('extractSalaryBounds', () => {
  it('parses "$120k"', () => {
    const result = extractSalaryBounds('Salary: $120k');
    expect(result).toEqual({ min: 120000, max: 120000 });
  });

  it('parses "$120,000"', () => {
    const result = extractSalaryBounds('Salary: $120,000');
    expect(result).toEqual({ min: 120000, max: 120000 });
  });

  it('parses bare "120K"', () => {
    const result = extractSalaryBounds('Comp range 120K');
    expect(result).toEqual({ min: 120000, max: 120000 });
  });

  it('parses a range "$120k-$180k"', () => {
    const result = extractSalaryBounds('$120k-$180k base');
    expect(result).toEqual({ min: 120000, max: 180000 });
  });

  it('skips equity-only mentions', () => {
    const result = extractSalaryBounds('equity 0.5% vesting over 4 years');
    expect(result).toEqual({ min: null, max: null });
  });

  it('skips values out of range (too low)', () => {
    const result = extractSalaryBounds('$5k signing bonus');
    expect(result).toEqual({ min: null, max: null });
  });

  it('returns null for text with no salary info', () => {
    const result = extractSalaryBounds('Great company culture and benefits');
    expect(result).toEqual({ min: null, max: null });
  });
});

// ─── classifyRole ───────────────────────────────────────────────────────

describe('classifyRole', () => {
  it('classifies product manager', () => {
    expect(classifyRole('We are hiring a Product Manager')).toBe('product');
  });

  it('classifies data analyst', () => {
    expect(classifyRole('Looking for a Data Analyst')).toBe('analyst');
  });

  it('classifies data engineer', () => {
    expect(classifyRole('Data Engineer - ETL pipelines')).toBe('data_eng');
  });

  it('classifies software engineer', () => {
    expect(classifyRole('Software Engineer, Backend')).toBe('engineering');
  });

  it('classifies designer', () => {
    expect(classifyRole('Product Designer - UX')).toBe('design');
  });

  it('returns "other" for unrecognized roles', () => {
    expect(classifyRole('Chief Happiness Officer')).toBe('other');
  });

  it('classifies TPM via keyword boundary', () => {
    expect(classifyRole('We need a tpm for our team')).toBe('product');
  });
});

// ─── detectWorkEnvironment ──────────────────────────────────────────────

describe('detectWorkEnvironment', () => {
  it('detects remote', () => {
    expect(detectWorkEnvironment('This is a remote position')).toBe(WorkEnvironment.Remote);
  });

  it('detects WFH', () => {
    expect(detectWorkEnvironment('WFH friendly')).toBe(WorkEnvironment.Remote);
  });

  it('detects hybrid', () => {
    expect(detectWorkEnvironment('Hybrid - 3 days in office')).toBe(WorkEnvironment.Hybrid);
  });

  it('detects on-site', () => {
    expect(detectWorkEnvironment('On-site in NYC')).toBe(WorkEnvironment.InOffice);
  });

  it('detects in-office', () => {
    expect(detectWorkEnvironment('This is an in-office role')).toBe(WorkEnvironment.InOffice);
  });

  it('returns NotSpecified when no match', () => {
    expect(detectWorkEnvironment('Great job opportunity')).toBe(WorkEnvironment.NotSpecified);
  });
});

// ─── extractTags ────────────────────────────────────────────────────────

describe('extractTags', () => {
  it('adds role tag based on category', () => {
    const tags = extractTags('some text about react', 'engineering');
    expect(tags).toContain('Engineering');
  });

  it('detects tech keywords', () => {
    const tags = extractTags('we use react, typescript, and python', 'other');
    expect(tags).toContain('React');
    expect(tags).toContain('TypeScript');
    expect(tags).toContain('Python');
  });

  it('limits to 8 tags max', () => {
    const text = 'react typescript python sql aws gcp azure kubernetes docker node rust snowflake bigquery';
    const tags = extractTags(text, 'engineering');
    expect(tags.length).toBeLessThanOrEqual(8);
  });

  it('does not duplicate tags', () => {
    const tags = extractTags('react react react', 'other');
    const reactCount = tags.filter(t => t === 'React').length;
    expect(reactCount).toBe(1);
  });

  it('returns empty array for no matches and unknown role', () => {
    const tags = extractTags('nothing relevant here', 'other');
    expect(tags).toEqual([]);
  });
});
