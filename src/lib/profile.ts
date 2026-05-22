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
 * Create or update a user's profile using the secure server-side RPC.
 * The RPC enforces auth.uid() = id, preventing impersonation.
 */
export async function setProfileUsername(username: string): Promise<ProfileResult<{ id: string; username: string }>> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase not configured' };

  const { data, error } = await supabase.rpc('upsert_profile', {
    p_username: username,
  });

  if (error) {
    if (error.code === '23505' || error.message.includes('already taken')) {
      return { error: 'Username is already taken' };
    }
    return { error: error.message };
  }

  return { data: data as unknown as { id: string; username: string } };
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
