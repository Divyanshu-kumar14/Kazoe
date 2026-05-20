import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

/**
 * Lazily initialised Supabase client.
 * Returns null when env vars are missing (e.g. Vercel without Supabase config),
 * allowing the rest of the app (practice mode, etc.) to work without Supabase.
 */
export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        log_level: 'info',
      },
    },
  });
  return _supabase;
}

/**
 * Throws if Supabase is not configured — use in multiplayer code paths only.
 */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      'Multiplayer requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
      'Set these in your .env file or Vercel environment variables.'
    );
  }
  return client;
}


