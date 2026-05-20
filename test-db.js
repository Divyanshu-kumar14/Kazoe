import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Simple parsing of .env
const envText = readFileSync('.env', 'utf-8');
const lines = envText.split('\n');
const env = {};
for (const line of lines) {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Signing in anonymously...');
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  const uid = authData.user.id;
  console.log('Signed in as user ID:', uid);

  console.log('Checking matches table...');
  const { data, error } = await supabase.from('matches').select('*').limit(1);
  if (error) {
    console.error('Error selecting matches:', error);
  } else {
    console.log('Matches table check success, data count:', data.length);
  }

  console.log('Checking claim_public_match RPC with actual uid...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('claim_public_match', { pid: uid });
  if (rpcError) {
    console.error('RPC Error:', rpcError);
  } else {
    console.log('RPC success:', rpcData);
  }
}

check();
