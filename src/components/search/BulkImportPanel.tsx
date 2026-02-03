/**
 * Panel for the "Manual Import" tab — paste one or more raw job descriptions
 * and have Claude AI parse them into structured {@link SearchResult} objects.
 *
 * After parsing, results are appended to the shared results grid where they
 * can be previewed and imported like any other search result.
 *
 * @module BulkImportPanel
 */

import { useState } from 'react';
import { SearchResult } from '../../types';
import { ClaudeService } from '../../services/claude';

interface BulkImportPanelProps {
  /** Called with an array of parsed results after Claude finishes extraction. */
  onResultsParsed: (results: SearchResult[]) => void;
}

/** Textarea + "Parse with AI" button for bulk manual job import. */
export const BulkImportPanel = ({ onResultsParsed }: BulkImportPanelProps) => {
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!text.trim()) {
      setError('Please paste at least one job description');
      return;
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError('AI parsing requires an Anthropic API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const results = await ClaudeService.parseMultipleDescriptions(text);
      if (results.length === 0) {
        setError('No job postings could be extracted from the text');
        return;
      }
      onResultsParsed(results);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse job descriptions');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Paste Job Descriptions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Paste one or more job descriptions below. Claude AI will parse them into structured listings that you can review and import.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Paste job description(s) here...&#10;&#10;You can paste multiple postings — separate them with a blank line or header.&#10;&#10;Example:&#10;---&#10;Senior Frontend Developer&#10;TechCorp - Remote&#10;$130k - $170k&#10;We're looking for a senior frontend developer...&#10;---&#10;Backend Engineer&#10;DataCo - San Francisco, CA&#10;..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleParse}
            disabled={isParsing || !text.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {isParsing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Parsing with AI...
              </span>
            ) : (
              'Parse with AI'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
