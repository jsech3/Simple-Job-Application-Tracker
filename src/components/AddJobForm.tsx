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
  });

  const [hasApplied, setHasApplied] = useState(true);
  const [userNotes, setUserNotes] = useState('');

  // Handle job description parsing
  const handleParse = async () => {
    if (!jobText.trim()) {
      setError('Please paste the job description');
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

      StorageService.saveApplication(application);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    }
  };

  // Render job description input step
  if (step === 'input') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Job Application</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paste Job Description
          </label>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the entire job posting here (Ctrl+A, Ctrl+C from the job page)...&#10;&#10;Example:&#10;Senior Software Engineer&#10;Acme Corp - San Francisco, CA&#10;$120k - $180k&#10;&#10;We're looking for an experienced engineer to join our team..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            autoFocus
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            💡 <strong>Tip:</strong> Copy the entire job posting from LinkedIn, Indeed, or any job site - AI will extract the details
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job URL (Optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Helps identify the platform (LinkedIn, Indeed, etc.)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleParse}
            disabled={isLoading || !jobText.trim()}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {isLoading ? 'Parsing with AI...' : '✨ Parse with AI'}
          </button>
          <button
            onClick={() => setStep('manual')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Manual Entry
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Parsing job posting with AI...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Extracting title, company, salary, and more...</p>
        </div>
      </div>
    );
  }

  // Render review/manual entry form
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {step === 'review' ? '✨ Review AI-Parsed Data' : 'Manual Entry'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {step === 'review' && parsedData?.confidence && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">AI Confidence Scores:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700 dark:text-blue-300">
            <div>Title: {parsedData.confidence.title}%</div>
            <div>Company: {parsedData.confidence.company}%</div>
            <div>Work Environment: {parsedData.confidence.workEnvironment}%</div>
            <div>Work Type: {parsedData.confidence.workType}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => updateField('company', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="City, State, Country"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</label>
          <select
            value={formData.platform}
            onChange={(e) => updateField('platform', e.target.value as JobPlatform)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(JobPlatform).map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>

        {/* Work Environment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Environment</label>
          <select
            value={formData.workEnvironment}
            onChange={(e) => updateField('workEnvironment', e.target.value as WorkEnvironment)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(WorkEnvironment).map(env => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>
        </div>

        {/* Work Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
          <select
            value={formData.workType}
            onChange={(e) => updateField('workType', e.target.value as WorkType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(WorkType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Compensation (Optional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min</label>
            <input
              type="number"
              value={formData.compensation?.min || ''}
              onChange={(e) => updateCompensation('min', e.target.value ? Number(e.target.value) : undefined as any)}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max</label>
            <input
              type="number"
              value={formData.compensation?.max || ''}
              onChange={(e) => updateCompensation('max', e.target.value ? Number(e.target.value) : undefined as any)}
              placeholder="75000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Currency</label>
            <input
              type="text"
              value={formData.compensation?.currency || 'USD'}
              onChange={(e) => updateCompensation('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Period</label>
            <select
              value={formData.compensation?.period || 'annual'}
              onChange={(e) => updateCompensation('period', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="annual">Annual</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Description Summary */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Job Description Summary</label>
        <textarea
          value={formData.descriptionSummary}
          onChange={(e) => updateField('descriptionSummary', e.target.value)}
          rows={4}
          placeholder="Brief summary of the role and requirements..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* User Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Notes (Optional)
        </label>
        <textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          rows={3}
          placeholder="Any notes about this role? (e.g., key talking points, who you spoke with, why you're excited)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          These notes will be used to personalize follow-up emails
        </p>
      </div>

      {/* Have you applied? */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={hasApplied}
            onChange={(e) => setHasApplied(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">I have already applied to this job</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save Application
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
