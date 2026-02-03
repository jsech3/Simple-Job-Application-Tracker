/**
 * Main Job Search page — container component that wires together four tabs:
 *
 * 1. **Search Job Boards** — keyword / location search via the JSearch API.
 * 2. **AI Suggestions** — fill in a profile, Claude generates smart queries,
 *    queries run through JSearch to find real listings.
 * 3. **Hacker News** — search HN "Who is hiring?" threads with role/tech/location filters.
 * 4. **Manual Import** — paste raw job descriptions, Claude parses them.
 *
 * @module JobSearch
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchResult,
  SearchTab,
  JobSearchFilters,
  UserProfile,
  JobApplication,
  WorkEnvironment,
  WorkType,
} from '../types';
import { searchJobs } from '../services/jobSearch';
import { searchHN, defaultHNFilters, type HNSearchFilters, type HNRoleCategory } from '../services/hnSearch';
import { ClaudeService } from '../services/claude';
import { StorageService } from '../services/storage';
import { SearchFilters } from './search/SearchFilters';
import { SearchResultCard } from './search/SearchResultCard';
import { SearchResultPreview } from './search/SearchResultPreview';
import { BulkImportPanel } from './search/BulkImportPanel';
import { staggerContainer, staggerItem, slideUp } from '../animations/variants';

interface JobSearchProps {
  onImportSuccess: () => void;
}

const defaultFilters: JobSearchFilters = {
  query: '',
  location: '',
  workEnvironment: '',
  workType: '',
  remoteOnly: false,
  datePosted: 'all',
  page: 1,
  pageSize: 10,
};

const defaultProfile: UserProfile = {
  skills: [],
  desiredTitles: [],
  preferredLocations: [],
  workEnvironmentPreference: '',
  workTypePreference: '',
  salaryMin: null,
  experienceLevel: '',
  industries: [],
};

const inputClass = "w-full px-3.5 py-2 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 placeholder-zinc-400 dark:placeholder-zinc-600";
const labelClass = "block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider";

export const JobSearch = ({ onImportSuccess }: JobSearchProps) => {
  const [activeTab, setActiveTab] = useState<SearchTab>('api_search');
  const [filters, setFilters] = useState<JobSearchFilters>(defaultFilters);
  const [hnFilters, setHnFilters] = useState<HNSearchFilters>(defaultHNFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewResult, setPreviewResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // AI Suggestions state
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [suggestedQueries, setSuggestedQueries] = useState<{ query: string; location: string }[]>([]);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);

  // Batch import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  // Load saved profile on mount
  useEffect(() => {
    StorageService.getUserProfile().then((saved) => {
      if (saved) setProfile(saved);
    });
  }, []);

  // --- Duplicate checker ---
  const markDuplicates = async (searchResults: SearchResult[]): Promise<SearchResult[]> => {
    const existing = await StorageService.getAllApplications();
    const existingUrls = new Set(existing.map(a => a.url).filter(Boolean));
    const existingKeys = new Set(
      existing.map(a => `${a.parsedData.title.toLowerCase()}|${a.parsedData.company.toLowerCase()}`)
    );
    return searchResults.map(r => ({
      ...r,
      imported:
        (r.url && existingUrls.has(r.url)) ||
        existingKeys.has(`${r.title.toLowerCase()}|${r.company.toLowerCase()}`),
    }));
  };

  // --- API Search ---
  const handleSearch = useCallback(async () => {
    if (!filters.query.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { results: searchResults } = await searchJobs(filters);
      const marked = await markDuplicates(searchResults);
      setResults(marked);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // --- HN Search ---
  const handleHNSearch = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const searchResults = await searchHN(hnFilters);
      const marked = await markDuplicates(searchResults);
      setResults(marked);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'HN search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- AI Suggestions ---
  const handleGenerateSuggestions = async () => {
    setIsGeneratingQueries(true);
    setError(null);
    try {
      await StorageService.saveUserProfile(profile);
      const { queries } = await ClaudeService.suggestJobSearches(profile);
      setSuggestedQueries(queries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  const handleRunSuggestedQuery = async (query: string, location: string) => {
    const newFilters: JobSearchFilters = { ...defaultFilters, query, location };
    setFilters(newFilters);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { results: searchResults } = await searchJobs(newFilters);
      const marked = await markDuplicates(
        searchResults.map(r => ({ ...r, source: 'ai_suggestion' as const }))
      );
      setResults(marked);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Manual Import ---
  const handleBulkParsed = (parsed: SearchResult[]) => {
    setResults(prev => [...parsed, ...prev]);
    setHasSearched(true);
  };

  // --- Selection ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSingleImported = (id: string) => {
    setResults(prev => prev.map(r => (r.id === id ? { ...r, imported: true } : r)));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    onImportSuccess();
  };

  // --- Batch import ---
  const handleBatchImport = async () => {
    const toImport = results.filter(r => selectedIds.has(r.id) && !r.imported);
    if (toImport.length === 0) return;
    setIsImporting(true);
    setImportProgress({ done: 0, total: toImport.length });
    let importedCount = 0;
    let skippedCount = 0;

    for (const result of toImport) {
      try {
        const application: JobApplication = {
          id: uuidv4(),
          url: result.url || '',
          parsedData: {
            title: result.title,
            company: result.company,
            compensation: result.compensation,
            workEnvironment: result.workEnvironment,
            workType: result.workType,
            location: result.location,
            platform: result.platform,
            benefits: result.benefits,
            descriptionSummary: result.description,
            tags: result.tags,
          },
          userNotes: '',
          hasApplied: false,
          applicationDate: new Date().toISOString(),
          statusUpdates: [],
          followUpReminderShown: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await StorageService.saveApplication(application);
        importedCount++;
        setResults(prev => prev.map(r => (r.id === result.id ? { ...r, imported: true } : r)));
      } catch {
        skippedCount++;
      }
      setImportProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setIsImporting(false);
    setSelectedIds(new Set());
    onImportSuccess();
    if (skippedCount > 0) {
      setError(`Imported ${importedCount}, skipped ${skippedCount} (duplicates)`);
    }
  };

  // --- Profile helpers ---
  const updateProfileField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };
  const parseCommaSeparated = (value: string): string[] =>
    value.split(',').map(s => s.trim()).filter(Boolean);

  // --- Tabs ---
  const tabs: { id: SearchTab; label: string }[] = [
    { id: 'api_search', label: 'Job Boards' },
    { id: 'hn_search', label: 'Hacker News' },
    { id: 'ai_suggestions', label: 'AI Suggestions' },
    { id: 'manual_import', label: 'Manual Import' },
  ];

  const selectedCount = selectedIds.size;
  const importableSelected = results.filter(r => selectedIds.has(r.id) && !r.imported).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-6 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-lg p-0.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(null); }}
            className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* JSearch filters */}
      {activeTab === 'api_search' && (
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {/* ─── HN Search tab ────────────────────────────────────────────── */}
      {activeTab === 'hn_search' && (
        <div className="glass-card rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0v24h24V0H0zm12.8 14.4v5.1H11v-5.1L6 4.5h2.2l3.9 7.4 3.7-7.4H18l-5.2 9.9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">Hacker News &ldquo;Who is hiring?&rdquo;</h3>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-500">Startup jobs from monthly HN threads. No API key needed.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Keyword */}
            <div>
              <label className={labelClass}>Keyword</label>
              <input
                type="text"
                value={hnFilters.keyword}
                onChange={e => setHnFilters(f => ({ ...f, keyword: e.target.value }))}
                placeholder="e.g. React, data, product..."
                className={inputClass}
              />
            </div>

            {/* Role Category */}
            <div>
              <label className={labelClass}>Role Category</label>
              <select
                value={hnFilters.roleCategory}
                onChange={e => setHnFilters(f => ({ ...f, roleCategory: e.target.value as HNRoleCategory }))}
                className={inputClass}
              >
                <option value="all">All Roles</option>
                <option value="product">Product / TPM</option>
                <option value="analyst">Business / Data Analyst</option>
                <option value="data_eng">Data / Analytics Engineering</option>
                <option value="engineering">Software Engineering</option>
                <option value="design">Design</option>
              </select>
            </div>

            {/* Min Salary */}
            <div>
              <label className={labelClass}>Min Salary (USD)</label>
              <input
                type="number"
                value={hnFilters.minSalary || ''}
                onChange={e => setHnFilters(f => ({ ...f, minSalary: e.target.value ? Number(e.target.value) : 0 }))}
                placeholder="e.g. 100000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Toggle filters */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hnFilters.requireTech}
                onChange={e => setHnFilters(f => ({ ...f, requireTech: e.target.checked }))}
                className="w-3.5 h-3.5 text-indigo-600 border-zinc-300 dark:border-zinc-600 rounded"
              />
              <span className="text-[12px] text-zinc-600 dark:text-zinc-400">Tech companies only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hnFilters.requireLocation}
                onChange={e => setHnFilters(f => ({ ...f, requireLocation: e.target.checked }))}
                className="w-3.5 h-3.5 text-indigo-600 border-zinc-300 dark:border-zinc-600 rounded"
              />
              <span className="text-[12px] text-zinc-600 dark:text-zinc-400">Remote / SF / NYC only</span>
            </label>

            {/* Days back */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-zinc-500 dark:text-zinc-500">Last</span>
              <select
                value={hnFilters.daysBack}
                onChange={e => setHnFilters(f => ({ ...f, daysBack: Number(e.target.value) }))}
                className="px-2 py-1 text-[12px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-md"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleHNSearch}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-orange-600 dark:bg-orange-500 text-white hover:bg-orange-700 dark:hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Searching HN...' : 'Search Hacker News'}
          </button>
        </div>
      )}

      {/* ─── AI Suggestions tab ───────────────────────────────────────── */}
      {activeTab === 'ai_suggestions' && (
        <div className="mb-6">
          <div className="glass-card rounded-xl p-5 mb-4">
            <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Your Profile</h3>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-500 mb-4">
              Fill in your profile and Claude will generate smart search queries to find relevant positions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Skills</label>
                <input type="text" value={profile.skills.join(', ')} onChange={(e) => updateProfileField('skills', parseCommaSeparated(e.target.value))} placeholder="React, TypeScript, Node.js..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Desired Titles</label>
                <input type="text" value={profile.desiredTitles.join(', ')} onChange={(e) => updateProfileField('desiredTitles', parseCommaSeparated(e.target.value))} placeholder="Frontend Developer, Full Stack..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Locations</label>
                <input type="text" value={profile.preferredLocations.join(', ')} onChange={(e) => updateProfileField('preferredLocations', parseCommaSeparated(e.target.value))} placeholder="New York, Remote..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Industries</label>
                <input type="text" value={profile.industries.join(', ')} onChange={(e) => updateProfileField('industries', parseCommaSeparated(e.target.value))} placeholder="FinTech, Healthcare, SaaS..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Experience Level</label>
                <select value={profile.experienceLevel} onChange={(e) => updateProfileField('experienceLevel', e.target.value as UserProfile['experienceLevel'])} className={inputClass}>
                  <option value="">Not specified</option>
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Min Salary</label>
                <input type="number" value={profile.salaryMin ?? ''} onChange={(e) => updateProfileField('salaryMin', e.target.value ? Number(e.target.value) : null)} placeholder="80000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Work Environment</label>
                <select value={profile.workEnvironmentPreference} onChange={(e) => updateProfileField('workEnvironmentPreference', e.target.value as UserProfile['workEnvironmentPreference'])} className={inputClass}>
                  <option value="">Any</option>
                  {Object.values(WorkEnvironment).filter(v => v !== WorkEnvironment.NotSpecified).map(env => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Work Type</label>
                <select value={profile.workTypePreference} onChange={(e) => updateProfileField('workTypePreference', e.target.value as UserProfile['workTypePreference'])} className={inputClass}>
                  <option value="">Any</option>
                  {Object.values(WorkType).filter(v => v !== WorkType.NotSpecified).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerateSuggestions}
                disabled={isGeneratingQueries || (!profile.skills.length && !profile.desiredTitles.length)}
                className="px-5 py-2 rounded-lg text-[13px] font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {isGeneratingQueries ? 'Generating...' : 'Generate Suggestions'}
              </button>
            </div>
          </div>

          {/* Suggested queries */}
          {suggestedQueries.length > 0 && (
            <div className="glass-card rounded-xl p-4 mb-4">
              <h4 className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Suggested Searches</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleRunSuggestedQuery(sq.query, sq.location)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[12px] hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition disabled:opacity-50"
                  >
                    {sq.query}{sq.location ? ` in ${sq.location}` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Import tab */}
      {activeTab === 'manual_import' && (
        <BulkImportPanel onResultsParsed={handleBulkParsed} />
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-24"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {results.map(result => (
            <motion.div key={result.id} variants={staggerItem}>
              <SearchResultCard
                result={result}
                isSelected={selectedIds.has(result.id)}
                onToggleSelect={toggleSelect}
                onClick={setPreviewResult}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {hasSearched && !isLoading && results.length === 0 && (
        <motion.div className="text-center py-16" variants={slideUp} initial="hidden" animate="visible">
          <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">No results found</p>
          <p className="text-zinc-400 dark:text-zinc-600 text-[13px] mt-1">Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 text-[13px]">Searching...</p>
        </div>
      )}

      {/* Batch action bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 shadow-lg z-40"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
              <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-900 dark:text-zinc-100">{selectedCount}</strong> selected
                {importableSelected < selectedCount && (
                  <span className="text-zinc-400 dark:text-zinc-600"> ({selectedCount - importableSelected} already imported)</span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-[13px]"
                >
                  Clear
                </button>
                <button
                  onClick={handleBatchImport}
                  disabled={isImporting || importableSelected === 0}
                  className="px-5 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-[13px] font-medium"
                >
                  {isImporting
                    ? `Importing ${importProgress.done}/${importProgress.total}...`
                    : `Import ${importableSelected}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      {previewResult && (
        <SearchResultPreview
          result={previewResult}
          onClose={() => setPreviewResult(null)}
          onImported={handleSingleImported}
        />
      )}
    </div>
  );
};
