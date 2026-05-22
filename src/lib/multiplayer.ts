import { requireSupabase } from './supabase';
import type { Question } from '../utils/questionGenerator';

export interface MatchConfig {
  level: number;
  questionType: 'add_sub' | 'multiplication' | 'division';
  timeLimitSeconds: number;
}

export interface Match {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  is_public: boolean;
  player1_id: string;
  player2_id: string | null;
  questions: Question[];
  scores: { player1: number; player2: number } | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  config: MatchConfig;
}

export interface AnswerPayload {
  playerId: string;
  questionIndex: number;
  answer: number | null;
  isCorrect: boolean;
  timeTaken: number;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[array[i]! % CODE_CHARS.length];
  }
  return code;
}

export async function createPrivateMatch(
  playerId: string,
  questions: Question[],
  config: MatchConfig
): Promise<string> {
  const code = generateRoomCode();

  const { error } = await requireSupabase().from('matches').insert({
    id: code,
    status: 'waiting',
    is_public: false,
    player1_id: playerId,
    questions,
    config,
  });

  if (error) throw error;
  return code;
}

export async function joinPrivateMatch(
  code: string,
  playerId: string
): Promise<Match> {
  const normalized = code.toUpperCase().replace(/-/g, '');

  const { data, error } = await requireSupabase().rpc('claim_private_match', {
    room_code: normalized,
    pid: playerId,
  });

  if (error) {
    throw new Error(`Join failed: ${error.message}`);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('Room not found or already taken');
  }

  const match = Array.isArray(data) ? data[0] : data;
  return match as unknown as Match;
}

export async function subscribeToMatchUpdate(
  matchId: string,
  onUpdate: (match: Match) => void
) {
  const channel = requireSupabase()
    .channel(`match-db-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        onUpdate(payload.new as unknown as Match);
      }
    )
    .subscribe();

  return channel;
}

export interface FinalizeResult {
  winner_id: string | null;
  decided_by: 'correct_count' | 'accuracy' | 'efficiency' | 'speed' | 'draw';
  already_finished: boolean;
}

export async function finalizeMatch(matchId: string): Promise<FinalizeResult> {
  const { data, error } = await requireSupabase().rpc('finalize_match', {
    match_id: matchId,
  });

  if (error) throw error;
  return data as FinalizeResult;
}

export async function cleanupMatch(matchId: string) {
  await requireSupabase().from('matches').delete().eq('id', matchId);
}
