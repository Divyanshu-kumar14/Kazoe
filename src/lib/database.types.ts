/**
 * Manual Supabase type definitions for the Kazoe project.
 *
 * These mirror the schema from supabase/migrations/* and the RPC signatures.
 * Update when adding new tables, columns, or RPCs.
 *
 * To generate from a live project instead (requires Supabase CLI):
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */
import type { Question } from '../utils/questionGenerator';

// ── Tables ──────────────────────────────────────────────────────────

export interface MatchRow {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  is_public: boolean;
  player1_id: string;
  player2_id: string | null;
  questions: Question[];
  scores: Record<string, unknown> | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  config: Record<string, unknown>;
}

export interface MatchInsert {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  is_public: boolean;
  player1_id: string;
  player2_id?: string | null;
  questions: Question[];
  config: Record<string, unknown>;
  scores?: Record<string, unknown> | null;
  created_at?: string;
  started_at?: string | null;
}

export interface ProfileRow {
  id: string;
  username: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// ── RPC Arguments & Returns ─────────────────────────────────────────

export interface CreateMatchArgs {
  p_config: {
    level: number;
    questionType: 'add_sub' | 'multiplication' | 'division';
    timeLimitSeconds: number;
  };
}

export interface CreateMatchReturns {
  match_id: string;
  question_count: number;
}

export interface ClaimPrivateMatchArgs {
  room_code: string;
  pid: string;
}

export interface UpdateMatchProgressArgs {
  match_id: string;
  player_num: number;
  answers: Record<string, unknown>[];
  player_done: boolean;
}

export interface FinalizeMatchArgs {
  match_id: string;
}

export interface FinalizeMatchReturns {
  winner_id: string | null;
  decided_by: 'correct_count' | 'accuracy' | 'efficiency' | 'speed' | 'draw';
  already_finished: boolean;
  p1_score?: number;
  p2_score?: number;
  p1_attempts?: number;
  p2_attempts?: number;
}

export interface UpsertProfileArgs {
  p_username: string;
}

export interface UpsertProfileReturns {
  id: string;
  username: string;
  success: boolean;
}

// ── Database namespace for Supabase client generics ─────────────────

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: MatchRow;
        Insert: MatchInsert;
      };
      profiles: {
        Row: ProfileRow;
      };
    };
    Functions: {
      create_match: {
        Args: CreateMatchArgs;
        Returns: CreateMatchReturns;
      };
      claim_private_match: {
        Args: ClaimPrivateMatchArgs;
        Returns: unknown;
      };
      update_match_progress: {
        Args: UpdateMatchProgressArgs;
        Returns: void;
      };
      finalize_match: {
        Args: FinalizeMatchArgs;
        Returns: FinalizeMatchReturns;
      };
      upsert_profile: {
        Args: UpsertProfileArgs;
        Returns: UpsertProfileReturns;
      };
    };
  };
}
