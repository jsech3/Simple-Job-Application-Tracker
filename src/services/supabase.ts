import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Whether Supabase is configured (env vars present). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient | null = null;

/**
 * Return the Supabase singleton client.
 * Throws if env vars are missing — callers should gate on `isSupabaseConfigured` first.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  const isExtension = typeof chrome !== 'undefined' && chrome?.storage;

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // In the extension we persist the session to chrome.storage.local
      ...(isExtension
        ? {
            storage: {
              getItem: async (key: string): Promise<string | null> => {
                const data = await chrome.storage.local.get(key);
                return (data[key] as string) ?? null;
              },
              setItem: async (key: string, value: string) => {
                await chrome.storage.local.set({ [key]: value });
              },
              removeItem: async (key: string) => {
                await chrome.storage.local.remove(key);
              },
            },
          }
        : {}),
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return _client;
}
