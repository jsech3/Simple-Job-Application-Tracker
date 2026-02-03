import { getSupabase } from './supabase';
import { JobApplication, UserProfile } from '../types';

const STORAGE_KEY = 'job_applications';
const USER_PROFILE_KEY = 'user_profile';
const MIGRATION_FLAG = 'supabase_migration_complete';

/**
 * One-time migration of localStorage data into Supabase.
 * Idempotent — skips if the flag is already set or if cloud already has data.
 *
 * @returns Number of jobs migrated (0 if skipped).
 */
export async function migrateLocalDataToSupabase(userId: string): Promise<number> {
  // Already migrated?
  if (localStorage.getItem(MIGRATION_FLAG)) return 0;

  const supabase = getSupabase();

  // Check if cloud already has data for this user
  const { count } = await supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count && count > 0) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  // Read local jobs
  let localJobs: JobApplication[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localJobs = JSON.parse(raw);
  } catch {
    // corrupt data — nothing to migrate
  }

  // Read local profile
  let localProfile: UserProfile | null = null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) localProfile = JSON.parse(raw);
  } catch {
    // ignore
  }

  let migratedCount = 0;

  // Batch upsert jobs
  if (localJobs.length > 0) {
    const rows = localJobs.map(job => ({
      user_id: userId,
      data: job,
    }));

    const { error } = await supabase.from('job_applications').insert(rows);
    if (error) {
      console.error('Migration insert error:', error);
    } else {
      migratedCount = localJobs.length;
    }
  }

  // Migrate profile
  if (localProfile) {
    await supabase
      .from('user_profiles')
      .upsert({ id: userId, profile: localProfile }, { onConflict: 'id' });
  }

  localStorage.setItem(MIGRATION_FLAG, 'true');
  return migratedCount;
}
