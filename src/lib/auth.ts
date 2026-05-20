import { supabase } from './supabase';

function generateLocalId(): string {
  return crypto.randomUUID();
}

let userIdPromise: Promise<string> | null = null;

export async function getUserId(): Promise<string> {
  if (userIdPromise) return userIdPromise;

  userIdPromise = supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) return session.user.id;

    return supabase.auth.signInAnonymously().then(({ data, error }) => {
      if (data?.user) return data.user.id;
      console.warn('Supabase anonymous auth failed, using local fallback:', error?.message);
      return generateLocalId();
    });
  }).catch((err) => {
    console.warn('Supabase auth unavailable, using local fallback:', err);
    return generateLocalId();
  });

  return userIdPromise;
}
