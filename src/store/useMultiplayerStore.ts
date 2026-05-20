import { create } from 'zustand';
import { getUserId } from '../lib/auth';
import { extractError } from '../lib/errors';
import { requireSupabase } from '../lib/supabase';
import {
  type Match,
  type MatchConfig,
  type AnswerPayload,
  createPrivateMatch as apiCreatePrivateMatch,
  joinPrivateMatch as apiJoinPrivateMatch,
  finalizeMatch,
  cleanupMatch,
} from '../lib/multiplayer';
import { generateQuestions, generateSeed } from '../utils/questionGenerator';
import { SOROBAN_LEVELS } from '../utils/levelConfig';

const MULTIPLAYER_QUESTION_POOL = 60;

function generateMultiplayerQuestions(config: MatchConfig): import('../utils/questionGenerator').Question[] {
  const levelConfig = SOROBAN_LEVELS[config.level];
  const seed = generateSeed();
  return generateQuestions(levelConfig, MULTIPLAYER_QUESTION_POOL, seed, config.questionType);
}

export type MatchStatusValue =
  | 'idle'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'finished';

export interface MultiplayerState {
  userId: string | null;
  isAuthenticating: boolean;
  authError: string | null;

  matchId: string | null;
  match: Match | null;
  playerNumber: 1 | 2 | null;
  matchStatus: MatchStatusValue;
  isCreator: boolean;

  currentQuestionIndex: number;
  myAnswers: (AnswerPayload | null)[];
  opponentAnswers: (AnswerPayload | null)[];
  scores: [number, number];

  gameStartTime: number;
  questionStartTime: number;
  timeRemaining: number;

  forfeitTimer: number | null;
  multiplayerConfig: MatchConfig;

  initAuth: () => Promise<string>;
  setMultiplayerConfig: (partial: Partial<MatchConfig>) => void;
  createPrivateMatch: () => Promise<string>;
  joinPrivateMatch: (code: string) => Promise<void>;
  setMatch: (match: Match) => void;
  recoverMatch: (matchId: string) => Promise<void>;
  startCountdown: () => void;
  startGame: () => void;
  submitAnswer: (answer: number | null) => AnswerPayload | null;
  receiveOpponentAnswer: (payload: AnswerPayload) => void;
  endGame: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
  setForfeitTimer: (value: number | null) => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  userId: null,
  isAuthenticating: false,
  authError: null,

  matchId: null,
  match: null,
  playerNumber: null,
  matchStatus: 'idle',
  isCreator: false,

  currentQuestionIndex: 0,
  myAnswers: [],
  opponentAnswers: [],
  scores: [0, 0],

  gameStartTime: 0,
  questionStartTime: 0,
  timeRemaining: 180,

  forfeitTimer: null,
  multiplayerConfig: {
    level: 3,
    questionType: 'add_sub',
    timeLimitSeconds: 180,
  },

  initAuth: async () => {
    set({ isAuthenticating: true, authError: null });
    try {
      const userId = await getUserId();
      set({ userId, isAuthenticating: false });
      return userId;
    } catch (e) {
      const error = extractError(e, 'Auth failed');
      set({ authError: error, isAuthenticating: false });
      throw e;
    }
  },

  setMultiplayerConfig: (partial: Partial<MatchConfig>) => {
    const current = get().multiplayerConfig;
    set({ multiplayerConfig: { ...current, ...partial } });
  },

  createPrivateMatch: async () => {
    const { userId, multiplayerConfig } = get();
    if (!userId) throw new Error('Not authenticated');

    const questions = generateMultiplayerQuestions(multiplayerConfig);
    const code = await apiCreatePrivateMatch(userId, questions, multiplayerConfig);

    set({
      matchId: code,
      matchStatus: 'waiting',
      playerNumber: 1,
      isCreator: true,
      currentQuestionIndex: 0,
      myAnswers: new Array(MULTIPLAYER_QUESTION_POOL).fill(null),
      opponentAnswers: new Array(MULTIPLAYER_QUESTION_POOL).fill(null),
      scores: [0, 0],
    });

    return code;
  },

  joinPrivateMatch: async (code: string) => {
    const { userId } = get();
    if (!userId) throw new Error('Not authenticated');

    const match = await apiJoinPrivateMatch(code, userId);

    set({
      matchId: match.id,
      match,
      matchStatus: 'countdown',
      playerNumber: 2,
      isCreator: false,
      currentQuestionIndex: 0,
      myAnswers: new Array(MULTIPLAYER_QUESTION_POOL).fill(null),
      opponentAnswers: new Array(MULTIPLAYER_QUESTION_POOL).fill(null),
      scores: [0, 0],
    });
  },

  setMatch: (match: Match) => {
    const current = get();
    if (match.status === 'active' && current.matchStatus === 'waiting') {
      set({ match, matchStatus: 'countdown' });
    } else if (match.status === 'finished') {
      // If we already transitioned to 'finished' locally (from endGame),
      // don't overwrite the local match/scores — they're the source of truth
      if (current.matchStatus === 'finished') {
        return;
      }
      const dbScores = match.scores;
      const scores: [number, number] = [
        dbScores?.player1 ?? 0,
        dbScores?.player2 ?? 0,
      ];
      set({ match, matchStatus: 'finished', scores });
    } else {
      set({ match });
    }
  },

  startCountdown: () => {
    set({ matchStatus: 'countdown' });
  },

  startGame: () => {
    const state = get();
    const duration = state.match?.config?.timeLimitSeconds ?? state.multiplayerConfig.timeLimitSeconds;
    const now = performance.now();
    set({
      matchStatus: 'playing',
      currentQuestionIndex: 0,
      gameStartTime: now,
      questionStartTime: now,
      timeRemaining: duration,
    });
  },

  submitAnswer: (answer: number | null) => {
    const state = get();
    if (state.matchStatus !== 'playing') return null;

    const question = state.match?.questions[state.currentQuestionIndex];
    if (!question) return null;

    const index = state.currentQuestionIndex;
    if (state.myAnswers[index] !== null) return null;

    const endTime = performance.now();
    const timeTaken = endTime - state.questionStartTime;
    const isCorrect = answer !== null && answer === question.answer;

    const payload: AnswerPayload = {
      playerId: state.userId!,
      questionIndex: index,
      answer,
      isCorrect,
      timeTaken,
    };

    const myAnswers = [...state.myAnswers];
    myAnswers[index] = payload;

    const nextIndex = index + 1;
    const canAdvance = nextIndex < MULTIPLAYER_QUESTION_POOL;

    const newScores = [...state.scores] as [number, number];
    if (isCorrect) {
      if (state.playerNumber === 1) {
        newScores[0] += 1;
      } else {
        newScores[1] += 1;
      }
    }

    const playerScore = state.playerNumber === 1 ? newScores[0] : newScores[1];

    set({
      myAnswers,
      scores: newScores,
      currentQuestionIndex: canAdvance ? nextIndex : index,
      questionStartTime: canAdvance ? endTime : state.questionStartTime,
    });

    if (state.matchId && state.playerNumber) {
      scheduleProgressUpdate(state.matchId, state.playerNumber, payload, playerScore, myAnswers);
    }

    return payload;
  },

  receiveOpponentAnswer: (payload: AnswerPayload) => {
    const state = get();
    if (state.matchStatus !== 'playing') return;

    const opponentAnswers = [...state.opponentAnswers];
    opponentAnswers[payload.questionIndex] = payload;

    const oppCorrectCount = opponentAnswers.filter((a) => a?.isCorrect).length;
    const newScores = [...state.scores] as [number, number];
    if (state.playerNumber === 1) newScores[1] = oppCorrectCount;
    else newScores[0] = oppCorrectCount;

    set({ opponentAnswers, scores: newScores });
  },

  endGame: async () => {
    const state = get();
    if (!state.matchId || !state.userId || !state.match) return;
    if (state.matchStatus === 'finished') return;

    const { matchId, match, scores } = state;

    const [p1Score, p2Score] = scores;
    let winnerId: string | null = null;
    if (p1Score > p2Score) {
      winnerId = match.player1_id;
    } else if (p2Score > p1Score) {
      winnerId = match.player2_id ?? null;
    }
    const finalScores = { player1: p1Score, player2: p2Score };

    // Update local state FIRST so the results screen has correct data
    // even if the DB write fails or the realtime channel is already closed
    set({
      matchStatus: 'finished',
      match: {
        ...match,
        status: 'finished',
        winner_id: winnerId,
        scores: finalScores,
      },
      scores,
    });

    // Sync to DB in background — don't block navigation
    try {
      await finalizeMatch(matchId, finalScores, winnerId);
    } catch (err) {
      console.error('Failed to finalize match in DB:', err);
    }
  },

  cancelMatchmaking: async () => {
    const state = get();
    if (state.matchId && state.isCreator) {
      await cleanupMatch(state.matchId);
    }
    set({
      matchId: null,
      match: null,
      matchStatus: 'idle',
      isCreator: false,
    });
  },

  setForfeitTimer: (value: number | null) => {
    set({ forfeitTimer: value });
  },

  recoverMatch: async (matchId: string) => {
    const { userId } = get();
    const activeUserId = userId || (await getUserId());
    if (!activeUserId) throw new Error('Not authenticated');

    const { data: matchData, error } = await requireSupabase()
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !matchData) {
      throw new Error(error?.message || 'Match not found');
    }

    const match = matchData as unknown as Match;
    const playerNumber = match.player1_id === activeUserId ? 1 : match.player2_id === activeUserId ? 2 : null;
    if (!playerNumber) {
      throw new Error('User not part of this match');
    }

    const isCreator = playerNumber === 1;

    const myAnswers = new Array(MULTIPLAYER_QUESTION_POOL).fill(null);
    const opponentAnswers = new Array(MULTIPLAYER_QUESTION_POOL).fill(null);

    const rawScores = (match.scores ?? {}) as Record<string, unknown>;
    const p1Score = (rawScores.player1 as number) || 0;
    const p2Score = (rawScores.player2 as number) || 0;
    const scores: [number, number] = [p1Score, p2Score];

    const p1Answers = (rawScores.player1_answers as AnswerPayload[]) || [];
    const p2Answers = (rawScores.player2_answers as AnswerPayload[]) || [];

    p1Answers.forEach((ans: AnswerPayload) => {
      const target = playerNumber === 1 ? myAnswers : opponentAnswers;
      target[ans.questionIndex] = ans;
    });

    p2Answers.forEach((ans: AnswerPayload) => {
      const target = playerNumber === 2 ? myAnswers : opponentAnswers;
      target[ans.questionIndex] = ans;
    });

    const answeredCount = myAnswers.filter((a) => a !== null).length;
    const currentQuestionIndex = Math.min(MULTIPLAYER_QUESTION_POOL - 1, answeredCount);

    const duration = (match as Match).config?.timeLimitSeconds ?? 180;
    const startedAt = match.started_at ? new Date(match.started_at).getTime() : Date.now();
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    const timeRemaining = Math.max(0, duration - elapsedSeconds);
    const gameStartTime = performance.now() - (elapsedSeconds * 1000);

    let matchStatus: MatchStatusValue = 'idle';
    if (match.status === 'finished') {
      matchStatus = 'finished';
    } else if (match.status === 'active') {
      matchStatus = 'playing';
    } else if (match.status === 'waiting') {
      matchStatus = 'waiting';
    }

    const questionStartTime = matchStatus === 'playing' ? gameStartTime : 0;

    set({
      userId: activeUserId,
      matchId,
      match,
      playerNumber,
      matchStatus,
      isCreator,
      currentQuestionIndex,
      myAnswers,
      opponentAnswers,
      scores,
      gameStartTime,
      questionStartTime,
      timeRemaining,
    });
  },

  reset: () => {
    set({
      matchId: null,
      match: null,
      playerNumber: null,
      matchStatus: 'idle',
      isCreator: false,
      currentQuestionIndex: 0,
      myAnswers: [],
      opponentAnswers: [],
      scores: [0, 0],
      gameStartTime: 0,
      questionStartTime: 0,
      timeRemaining: 180,
      forfeitTimer: null,
    });
  },
}));

let progressTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingProgress: {
  matchId: string;
  playerNumber: 1 | 2;
  latestAnswer: AnswerPayload;
  playerScore: number;
  allAnswers: (AnswerPayload | null)[];
} | null = null;

function scheduleProgressUpdate(
  matchId: string,
  playerNumber: 1 | 2,
  latestAnswer: AnswerPayload,
  playerScore: number,
  allAnswers: (AnswerPayload | null)[]
) {
  pendingProgress = { matchId, playerNumber, latestAnswer, playerScore, allAnswers };
  if (progressTimeout) clearTimeout(progressTimeout);
  progressTimeout = setTimeout(async () => {
    if (!pendingProgress) return;
    const p = pendingProgress;
    pendingProgress = null;
    progressTimeout = null;

    try {
      // Use the atomic update_match_progress RPC instead of read-modify-write.
      // This prevents race conditions where concurrent opponent writes get overwritten.
      const submittedAnswers = p.allAnswers.filter(
        (a): a is AnswerPayload => a !== null
      );

      const { error } = await requireSupabase().rpc('update_match_progress', {
        match_id: p.matchId,
        player_num: p.playerNumber,
        player_score: p.playerScore,
        answers: submittedAnswers,
        player_done: false,
      });

      if (error) {
        console.error('Error updating match progress:', error);
      }
    } catch (err) {
      console.error('Failed to update match progress in background:', err);
    }
  }, 500);
}

export { MULTIPLAYER_QUESTION_POOL };
