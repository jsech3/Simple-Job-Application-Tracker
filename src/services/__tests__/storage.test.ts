import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase module before importing storage
vi.mock('../supabase', () => ({
  isSupabaseConfigured: false,
  getSupabase: vi.fn(),
}));

// Mock supabaseStorage to prevent side-effect imports
vi.mock('../supabaseStorage', () => ({
  SupabaseStorageService: {},
}));

// Mock the browser polyfill
vi.mock('../../extension/browser-polyfill', () => ({
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
}));

import { StorageService } from '../storage';
import * as supabaseModule from '../supabase';

describe('StorageService.isAuthenticated delegation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses localStorage path when Supabase is not configured', async () => {
    // isSupabaseConfigured is false by default in our mock
    localStorage.setItem('job_applications', JSON.stringify([]));

    const apps = await StorageService.getAllApplications();
    expect(apps).toEqual([]);
  });

  it('returns empty array when localStorage has no data and Supabase not configured', async () => {
    const apps = await StorageService.getAllApplications();
    expect(apps).toEqual([]);
  });

  it('delegates to Supabase when configured and authenticated', async () => {
    // Override isSupabaseConfigured to true
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: true,
      writable: true,
    });

    const mockGetSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: '123' } } },
    });

    vi.mocked(supabaseModule.getSupabase).mockReturnValue({
      auth: { getSession: mockGetSession },
    } as any);

    // Mock SupabaseStorageService.getAllApplications
    const { SupabaseStorageService } = await import('../supabaseStorage');
    (SupabaseStorageService as any).getAllApplications = vi.fn().mockResolvedValue([
      { id: 'supabase-1' },
    ]);

    const apps = await StorageService.getAllApplications();
    expect(apps).toEqual([{ id: 'supabase-1' }]);

    // Restore
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: false,
      writable: true,
    });
  });

  it('falls back to localStorage when Supabase configured but not authenticated', async () => {
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: true,
      writable: true,
    });

    const mockGetSession = vi.fn().mockResolvedValue({
      data: { session: null },
    });

    vi.mocked(supabaseModule.getSupabase).mockReturnValue({
      auth: { getSession: mockGetSession },
    } as any);

    localStorage.setItem('job_applications', JSON.stringify([{ id: 'local-1' }]));

    const apps = await StorageService.getAllApplications();
    expect(apps).toEqual([{ id: 'local-1' }]);

    // Restore
    Object.defineProperty(supabaseModule, 'isSupabaseConfigured', {
      value: false,
      writable: true,
    });
  });
});
