import { useState } from 'react';
import { JobApplication } from '../types';
import { ClaudeService } from '../services/claude';

interface EmailGeneratorProps {
  job: JobApplication;
  onClose: () => void;
}

export const EmailGenerator = ({ job, onClose }: EmailGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate email on mount
  useState(() => {
    generateEmail();
  });

  const generateEmail = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await ClaudeService.generateFollowUpEmail(job);

      if (result.success && result.email) {
        setEmail(result.email);
      } else {
        setError(result.error || 'Failed to generate email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!email) return;

    const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Follow-up Email</h2>
            <p className="text-gray-600 mt-1">
              {job.parsedData.title} at {job.parsedData.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isGenerating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900">Generating email...</h3>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={generateEmail}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : email ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Review and edit the email below before sending. Click "Copy to Clipboard" when ready.
                </p>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                <textarea
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Placeholders Guide */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> Remember to replace [Hiring Manager/Team] with the appropriate name if known,
                  and add your name at the bottom before sending.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {email && !isGenerating && (
          <div className="border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={generateEmail}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Regenerate
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
