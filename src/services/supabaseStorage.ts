import { getSupabase } from './supabase';
import { JobApplication, UserProfile } from '../types';

/**
 * Cloud storage layer backed by Supabase Postgres.
 * Mirrors the StorageService interface so the delegation layer can swap freely.
 */
export class SupabaseStorageService {
  // ─── Jobs ────────────────────────────────────────────────────────────

  static async getAllApplications(): Promise<JobApplication[]> {
    const { data, error } = await getSupabase()
      .from('job_applications')
      .select('data')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getAllApplications error:', error);
      return [];
    }
    return (data ?? []).map((row: { data: JobApplication }) => row.data);
  }

  static async getApplication(id: string): Promise<JobApplication | null> {
    const { data, error } = await getSupabase()
      .from('job_applications')
      .select('data')
      .eq('data->>id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getApplication error:', error);
      return null;
    }
    return data?.data ?? null;
  }

  static async saveApplication(application: JobApplication): Promise<boolean> {
    // Duplicate URL check
    if (application.url?.trim()) {
      const { data: existing } = await getSupabase()
        .from('job_applications')
        .select('data')
        .eq('data->>url', application.url)
        .maybeSingle();

      if (existing) {
        const dup = existing.data as JobApplication;
        throw new Error(
          `You already applied to this job on ${new Date(dup.applicationDate).toLocaleDateString()}`
        );
      }
    }

    const userId = (await getSupabase().auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await getSupabase()
      .from('job_applications')
      .insert({ user_id: userId, data: application });

    if (error) throw error;
    return true;
  }

  static async updateApplication(id: string, updates: Partial<JobApplication>): Promise<boolean> {
    // Fetch current row to merge
    const { data: row, error: fetchErr } = await getSupabase()
      .from('job_applications')
      .select('id, data')
      .eq('data->>id', id)
      .maybeSingle();

    if (fetchErr || !row) {
      console.error('Supabase updateApplication fetch error:', fetchErr);
      return false;
    }

    const merged = { ...row.data, ...updates, updatedAt: new Date().toISOString() };

    const { error } = await getSupabase()
      .from('job_applications')
      .update({ data: merged })
      .eq('id', row.id);

    if (error) {
      console.error('Supabase updateApplication error:', error);
      return false;
    }
    return true;
  }

  static async deleteApplication(id: string): Promise<boolean> {
    const { error } = await getSupabase()
      .from('job_applications')
      .delete()
      .eq('data->>id', id);

    if (error) {
      console.error('Supabase deleteApplication error:', error);
      return false;
    }
    return true;
  }

  // ─── User Profile ────────────────────────────────────────────────────

  static async getUserProfile(): Promise<UserProfile | null> {
    const userId = (await getSupabase().auth.getUser()).data.user?.id;
    if (!userId) return null;

    const { data, error } = await getSupabase()
      .from('user_profiles')
      .select('profile')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase getUserProfile error:', error);
      return null;
    }
    return (data?.profile as UserProfile) ?? null;
  }

  static async saveUserProfile(profile: UserProfile): Promise<boolean> {
    const userId = (await getSupabase().auth.getUser()).data.user?.id;
    if (!userId) return false;

    const { error } = await getSupabase()
      .from('user_profiles')
      .upsert({ id: userId, profile }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase saveUserProfile error:', error);
      return false;
    }
    return true;
  }
}
