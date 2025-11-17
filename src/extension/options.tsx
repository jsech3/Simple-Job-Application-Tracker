import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './browser-polyfill';
import '../index.css';

const API_KEY_STORAGE_KEY = 'anthropic_api_key';

function OptionsPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const data = await storage.sync.get(API_KEY_STORAGE_KEY);
      if (data[API_KEY_STORAGE_KEY]) {
        setApiKey(data[API_KEY_STORAGE_KEY]);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Failed to save API key. Please try again.');
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to remove your API key?')) {
      try {
        await storage.sync.remove(API_KEY_STORAGE_KEY);
        setApiKey('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        console.error('Error clearing API key:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Job Tracker Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your Anthropic API key for AI-powered job parsing
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Anthropic API Key
              </label>
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your API key is stored securely and synced across your devices
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                How to get an API key:
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>
                  Visit{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    Anthropic Console
                  </a>
                </li>
                <li>Sign up or log in to your account</li>
                <li>Navigate to API Keys section</li>
                <li>Create a new API key</li>
                <li>Copy and paste it here</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {saved ? '✓ Saved!' : 'Save API Key'}
              </button>

              {apiKey && (
                <button
                  onClick={handleClear}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Privacy & Security
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Your API key is stored locally in your browser
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  All job data is stored locally on your device
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  We never send your data to any servers except Anthropic's API
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  You can delete your data at any time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
