import { getSupabase } from './supabase';

export type Profile = {
  id: string;
  username: string;
  points: number;
  created_at: string;
  updated_at: string;
};

export type ProfileResult<T> = { data: T; error?: never } | { data?: never; error: string };

/**
 * Fetch a single user's profile by their user ID.
 */
export async function getProfile(userId: string): Promise<ProfileResult<Profile | null>> {
  const supabase = getSupabase();
  if (!supabase) return { data: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: null };
    }
    return { error: error.message };
  }

  return { data: data as Profile };
}


/**
 * Fetch the top players from the leaderboard.
 */
export async function getLeaderboard(limit = 100): Promise<ProfileResult<Profile[]>> {
  const supabase = getSupabase();
  if (!supabase) return { data: [] };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { data: (data || []) as Profile[] };
}
