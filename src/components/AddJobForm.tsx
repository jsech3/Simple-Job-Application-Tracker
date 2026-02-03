import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ClaudeService } from '../services/claude';
import { StorageService } from '../services/storage';
import {
  ParsedJobData,
  JobApplication,
  WorkEnvironment,
  WorkType,
  JobPlatform,
  Compensation,
} from '../types';

interface AddJobFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass = "w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 placeholder-zinc-400 dark:placeholder-zinc-600";
const labelClass = "block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider";

export const AddJobForm = ({ onSuccess, onCancel }: AddJobFormProps) => {
  const [step, setStep] = useState<'input' | 'parsing' | 'review' | 'manual'>('input');
  const [jobText, setJobText] = useState('');
  const [url, setUrl] = useState('');
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields for manual entry or editing
  const [formData, setFormData] = useState<ParsedJobData>({
    title: '',
    company: '',
    compensation: null,
    workEnvironment: WorkEnvironment.NotSpecified,
    workType: WorkType.NotSpecified,
    location: '',
    platform: JobPlatform.Other,
    benefits: [],
    descriptionSummary: '',
    tags: [],
  });

  const [hasApplied, setHasApplied] = useState(true);
  const [userNotes, setUserNotes] = useState('');

  // Handle job description parsing
  const handleParse = async () => {
    if (!jobText.trim()) {
      setError('Please paste the job description');
      return;
    }

    // Check if API key is configured
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError(
        'AI parsing requires an Anthropic API key. Add VITE_ANTHROPIC_API_KEY to your .env file, or use Manual Entry instead.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('parsing');

    try {
      // Use the new text-based parsing method
      const result = await ClaudeService.parseJobDescriptionText(jobText, url || undefined);

      if (result.success && result.data) {
        setParsedData(result.data);
        setFormData(result.data);
        setStep('review');
      } else {
        setError(result.error || 'Failed to parse job posting');
        setStep('manual');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('manual');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field updates
  const updateField = <K extends keyof ParsedJobData>(field: K, value: ParsedJobData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle compensation updates
  const updateCompensation = (field: keyof Compensation, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      compensation: {
        min: prev.compensation?.min,
        max: prev.compensation?.max,
        currency: prev.compensation?.currency || 'USD',
        period: prev.compensation?.period || 'annual',
        [field]: value,
      } as Compensation,
    }));
  };

  // Save the job application
  const handleSave = async () => {
    // Validation
    if (!formData.title || !formData.company) {
      setError('Job title and company name are required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const application: JobApplication = {
        id: uuidv4(),
        url: url || '',
        parsedData: formData,
        userNotes,
        hasApplied,
        applicationDate: new Date().toISOString(),
        statusUpdates: [],
        followUpReminderShown: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const success = await StorageService.saveApplication(application);

      if (success) {
        onSuccess();
      } else {
        setError('Failed to save application');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setIsLoading(false);
    }
  };

  // Render job description input step
  if (step === 'input') {
    return (
      <div className="glass-card rounded-xl p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-5">Add Application</h2>

        <div className="mb-5">
          <label className={labelClass}>Job Description</label>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the entire job posting here..."
            rows={10}
            className={`${inputClass} font-mono`}
            autoFocus
          />
          <p className="mt-1.5 text-[12px] text-zinc-400 dark:text-zinc-600">
            Copy from LinkedIn, Indeed, or any job site &mdash; AI extracts the details
          </p>
        </div>

        <div className="mb-5">
          <label className={labelClass}>Job URL <span className="text-zinc-400 dark:text-zinc-600 font-normal normal-case">(optional)</span></label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/..."
            className={inputClass}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[13px]">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleParse}
            disabled={isLoading || !jobText.trim()}
            className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-[13px] font-medium"
          >
            {isLoading ? 'Parsing...' : 'Parse with AI'}
          </button>
          <button
            onClick={() => setStep('manual')}
            className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-[13px] font-medium"
          >
            Manual
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition text-[13px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render parsing step
  if (step === 'parsing') {
    return (
      <div className="glass-card rounded-xl p-10 max-w-2xl mx-auto text-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">Parsing with AI...</h3>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-1">Extracting title, company, salary & more</p>
      </div>
    );
  }

  // Render review/manual entry form
  return (
    <div className="glass-card rounded-xl p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-5">
        {step === 'review' ? 'Review Parsed Data' : 'Manual Entry'}
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {step === 'review' && parsedData?.confidence && (
        <div className="mb-5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
          <p className="text-[12px] text-indigo-600 dark:text-indigo-400 font-medium mb-1.5 uppercase tracking-wider">AI Confidence</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-indigo-700 dark:text-indigo-300">
            <div>Title: {parsedData.confidence.title}%</div>
            <div>Company: {parsedData.confidence.company}%</div>
            <div>Work Env: {parsedData.confidence.workEnvironment}%</div>
            <div>Work Type: {parsedData.confidence.workType}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={labelClass}>Job Title <span className="text-red-400">*</span></label>
          <input type="text" value={formData.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Company <span className="text-red-400">*</span></label>
          <input type="text" value={formData.company} onChange={(e) => updateField('company', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input type="text" value={formData.location} onChange={(e) => updateField('location', e.target.value)} placeholder="City, State" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Platform</label>
          <select value={formData.platform} onChange={(e) => updateField('platform', e.target.value as JobPlatform)} className={inputClass}>
            {Object.values(JobPlatform).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Work Environment</label>
          <select value={formData.workEnvironment} onChange={(e) => updateField('workEnvironment', e.target.value as WorkEnvironment)} className={inputClass}>
            {Object.values(WorkEnvironment).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Work Type</label>
          <select value={formData.workType} onChange={(e) => updateField('workType', e.target.value as WorkType)} className={inputClass}>
            {Object.values(WorkType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-5 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
        <p className={labelClass}>Compensation <span className="text-zinc-400 dark:text-zinc-600 font-normal normal-case">(optional)</span></p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <div>
            <label className="block text-[11px] text-zinc-400 dark:text-zinc-600 mb-1">Min</label>
            <input type="number" value={formData.compensation?.min || ''} onChange={(e) => updateCompensation('min', e.target.value ? Number(e.target.value) : undefined as any)} placeholder="50000" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 dark:text-zinc-600 mb-1">Max</label>
            <input type="number" value={formData.compensation?.max || ''} onChange={(e) => updateCompensation('max', e.target.value ? Number(e.target.value) : undefined as any)} placeholder="75000" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 dark:text-zinc-600 mb-1">Currency</label>
            <input type="text" value={formData.compensation?.currency || 'USD'} onChange={(e) => updateCompensation('currency', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 dark:text-zinc-600 mb-1">Period</label>
            <select value={formData.compensation?.period || 'annual'} onChange={(e) => updateCompensation('period', e.target.value)} className={inputClass}>
              <option value="annual">Annual</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className={labelClass}>Description Summary</label>
        <textarea value={formData.descriptionSummary} onChange={(e) => updateField('descriptionSummary', e.target.value)} rows={3} placeholder="Brief summary..." className={inputClass} />
      </div>

      {/* Tags */}
      <div className="mb-5">
        <label className={labelClass}>Tags</label>
        <input type="text" value={formData.tags.join(', ')} onChange={(e) => updateField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))} placeholder="React, Senior, FinTech..." className={inputClass} />
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className={labelClass}>Your Notes</label>
        <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} rows={2} placeholder="Talking points, contacts, why you're excited..." className={inputClass} />
      </div>

      {/* Applied checkbox */}
      <div className="mb-5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={hasApplied} onChange={(e) => setHasApplied(e.target.checked)} className="w-4 h-4 text-indigo-600 border-zinc-300 dark:border-zinc-600 rounded focus:ring-indigo-500" />
          <span className="text-[13px] text-zinc-600 dark:text-zinc-400">I have already applied</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={isLoading} className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition text-[13px] font-medium">
          {isLoading ? 'Saving...' : 'Save Application'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition text-[13px]">
          Cancel
        </button>
      </div>
    </div>
  );
};
