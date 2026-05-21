import { getSupabase } from './supabase';

export type Profile = {
  id: string;
  username: string;
  points: number;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch a single user's profile by their user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

/**
 * Create or update a user's profile with a specific username.
 */
export async function setProfileUsername(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        username 
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error setting profile username:', error);
      // Checking for unique constraint violation
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        return { success: false, error: 'Username is already taken' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error setting profile username:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Fetch the top players from the leaderboard.
 */
export async function getLeaderboard(limit = 100): Promise<Profile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return (data || []) as Profile[];
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}
