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
import { getProfile } from '../lib/profile';


const MULTIPLAYER_QUESTION_POOL = 60;

export type MatchStatusValue =
  | 'idle'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'finished';

export interface MultiplayerState {
  userId: string | null;
  username: string | null;
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
  setUsername: (username: string | null) => void;
  tickTimer: (timeRemaining: number) => void;
  reset: () => void;
  
  progressTimeout: ReturnType<typeof setTimeout> | null;
  pendingProgress: {
    matchId: string;
    playerNumber: 1 | 2;
    latestAnswer: AnswerPayload;
    allAnswers: (AnswerPayload | null)[];
  } | null;
  scheduleProgressUpdate: (
    matchId: string,
    playerNumber: 1 | 2,
    latestAnswer: AnswerPayload,
    allAnswers: (AnswerPayload | null)[]
  ) => void;
  flushPendingProgress: () => Promise<void>;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  userId: null,
  username: null,
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
  tickTimer: (timeRemaining: number) => {
    const safe = Number.isFinite(timeRemaining) ? Math.max(0, timeRemaining) : 0;
    set({ timeRemaining: safe });
  },
  timeRemaining: 180,

  forfeitTimer: null,
  multiplayerConfig: {
    level: 3,
    questionType: 'add_sub',
    timeLimitSeconds: 180,
  },
  
  progressTimeout: null,
  pendingProgress: null,

  initAuth: async () => {
    set({ isAuthenticating: true, authError: null });
    try {
      const userId = await getUserId();
      const profileResult = await getProfile(userId);
      set({ 
        userId, 
        username: profileResult.data?.username ?? null,
        isAuthenticating: false 
      });
      return userId;
    } catch (e) {
      const error = extractError(e, 'Auth failed');
      set({ authError: error, isAuthenticating: false });
      throw e;
    }
  },

  setUsername: (username: string | null) => {
    set({ username });
  },

  setMultiplayerConfig: (partial: Partial<MatchConfig>) => {
    const current = get().multiplayerConfig;
    set({ multiplayerConfig: { ...current, ...partial } });
  },

  createPrivateMatch: async () => {
    const { userId, multiplayerConfig } = get();
    if (!userId) throw new Error('Not authenticated');

    const code = await apiCreatePrivateMatch(multiplayerConfig);

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
    
    // Merge new match data with current match data in the store to preserve fields like questions and config.
    // If the local match is null and the incoming update lacks questions (partial Realtime update),
    // we keep mergedMatch as null to avoid corrupting the store state with a broken/incomplete match.
    const mergedMatch = current.match ? {
      ...current.match,
      ...match,
      // Ensure we preserve questions and config if they are not in the update payload
      questions: match.questions !== undefined && match.questions !== null ? match.questions : current.match.questions,
      config: match.config !== undefined && match.config !== null ? match.config : current.match.config,
    } : (match.questions && match.questions.length > 0 ? match : null);

    if (!mergedMatch) {
      return;
    }

    const rawScores = (mergedMatch.scores ?? {}) as Record<string, any>;
    const p1Score = Number.isFinite(rawScores.player1) ? (rawScores.player1 as number) : 0;
    const p2Score = Number.isFinite(rawScores.player2) ? (rawScores.player2 as number) : 0;
    const scores: [number, number] = [p1Score, p2Score];

    const playerNumber = current.playerNumber;
    let myAnswers = current.myAnswers.length > 0 ? [...current.myAnswers] : new Array(MULTIPLAYER_QUESTION_POOL).fill(null);
    let opponentAnswers = current.opponentAnswers.length > 0 ? [...current.opponentAnswers] : new Array(MULTIPLAYER_QUESTION_POOL).fill(null);

    if (playerNumber) {
      const p1Answers = (rawScores.player1_answers as AnswerPayload[]) || [];
      const p2Answers = (rawScores.player2_answers as AnswerPayload[]) || [];

      p1Answers.forEach((ans: AnswerPayload) => {
        const target = playerNumber === 1 ? myAnswers : opponentAnswers;
        if (target[ans.questionIndex] === null) {
          target[ans.questionIndex] = ans;
        }
      });

      p2Answers.forEach((ans: AnswerPayload) => {
        const target = playerNumber === 2 ? myAnswers : opponentAnswers;
        if (target[ans.questionIndex] === null) {
          target[ans.questionIndex] = ans;
        }
      });
    }

    // Determine the next matchStatus
    let matchStatus = current.matchStatus;
    if (mergedMatch.status === 'active' && current.matchStatus === 'waiting') {
      // Only transition to countdown if we actually have questions loaded in the store
      if (mergedMatch.questions && mergedMatch.questions.length > 0) {
        matchStatus = 'countdown';
      }
    } else if (mergedMatch.status === 'finished') {
      matchStatus = 'finished';
    }

    // Keep the local scores in sync with the database if they are higher
    const localScores: [number, number] = [
      Math.max(scores[0], current.scores[0]),
      Math.max(scores[1], current.scores[1]),
    ];

    set({
      match: mergedMatch,
      matchStatus,
      scores: localScores,
      myAnswers,
      opponentAnswers,
    });
  },

  startCountdown: () => {
    set({ matchStatus: 'countdown' });
  },

  startGame: () => {
    const state = get();
    const rawDuration = state.match?.config?.timeLimitSeconds ?? state.multiplayerConfig.timeLimitSeconds;
    const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 180;
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
    const timeTaken = state.questionStartTime > 0 ? endTime - state.questionStartTime : 0;
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

    const prevScores = [...state.scores] as [number, number];
    const normalizedScores: [number, number] = [
      Number.isFinite(prevScores[0]) ? prevScores[0] : 0,
      Number.isFinite(prevScores[1]) ? prevScores[1] : 0,
    ];
    if (isCorrect) {
      if (state.playerNumber === 1) {
        normalizedScores[0] += 1;
      } else {
        normalizedScores[1] += 1;
      }
    }

    set({
      myAnswers,
      scores: normalizedScores,
      currentQuestionIndex: canAdvance ? nextIndex : index,
      questionStartTime: canAdvance ? endTime : state.questionStartTime,
    });

    if (state.matchId && state.playerNumber) {
      get().scheduleProgressUpdate(state.matchId, state.playerNumber, payload, myAnswers);
    }

    return payload;
  },

  receiveOpponentAnswer: (payload: AnswerPayload) => {
    const state = get();
    if (state.matchStatus !== 'playing') return;

    const opponentAnswers = [...state.opponentAnswers];
    const prevPayload = opponentAnswers[payload.questionIndex];

    // Incremental scoring: only adjust by the delta of this single answer,
    // instead of recomputing from scratch every time. This avoids race
    // conditions where a DB subscription fires mid-game and corrupts scores.
    let delta = 0;
    if (payload.isCorrect) delta = 1;
    if (prevPayload?.isCorrect) delta -= 1;

    opponentAnswers[payload.questionIndex] = payload;

    const prevScores = [...state.scores] as [number, number];
    const normalizedPrev: [number, number] = [
      Number.isFinite(prevScores[0]) ? prevScores[0] : 0,
      Number.isFinite(prevScores[1]) ? prevScores[1] : 0,
    ];
    const newScores: [number, number] = [...normalizedPrev];
    if (state.playerNumber === 1) newScores[1] = Math.max(0, newScores[1] + delta);
    else newScores[0] = Math.max(0, newScores[0] + delta);

    set({ opponentAnswers, scores: newScores });
  },

  endGame: async () => {
    const state = get();
    if (!state.matchId || !state.userId || !state.match) return;
    if (state.matchStatus === 'finished') return;

    const { matchId } = state;

    // 1. Flush any pending answer progress to DB first
    await get().flushPendingProgress();

    // 2. Call server-side atomic finalize (determines winner with tiebreakers)
    try {
      await finalizeMatch(matchId);
    } catch (err) {
      console.error('Failed to finalize match:', err);
    }

    set({ matchStatus: 'finished' });
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
    const cleanStartedAt = match.started_at ? match.started_at.replace(' ', 'T') : '';
    const parsedStartedAt = cleanStartedAt ? new Date(cleanStartedAt).getTime() : NaN;
    const startedAt = Number.isFinite(parsedStartedAt) ? parsedStartedAt : Date.now();
    const elapsedSeconds = Math.max(0, (Date.now() - startedAt) / 1000);
    const timeRemaining = Math.max(0, duration - elapsedSeconds);
    const gameStartTime = performance.now() - (elapsedSeconds * 1000);

    let matchStatus: MatchStatusValue = 'idle';
    if (match.status === 'finished') {
      matchStatus = 'finished';
    } else if (match.status === 'active') {
      const currentStatus = get().matchStatus;
      matchStatus = currentStatus === 'waiting' ? 'countdown' : 'playing';
    } else if (match.status === 'waiting') {
      matchStatus = 'waiting';
    }

    // When recovering mid-game, set questionStartTime to now so the next
    // answer's timeTaken starts fresh instead of reflecting the entire match
    // duration which could produce NaN or absurd values.
    const questionStartTime = matchStatus === 'playing' ? performance.now() : 0;

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
      progressTimeout: null,
      pendingProgress: null,
    });
  },

  scheduleProgressUpdate: (matchId, playerNumber, latestAnswer, allAnswers) => {
    const state = get();
    if (state.progressTimeout) clearTimeout(state.progressTimeout);

    const pendingProgress = { matchId, playerNumber, latestAnswer, allAnswers };
    const progressTimeout = setTimeout(async () => {
      const p = get().pendingProgress;
      set({ pendingProgress: null, progressTimeout: null });
      if (!p) return;

      try {
        const submittedAnswers = p.allAnswers.filter(
          (a): a is AnswerPayload => a !== null
        );

        const { error } = await requireSupabase().rpc('update_match_progress', {
          match_id: p.matchId,
          player_num: p.playerNumber,
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

    set({ pendingProgress, progressTimeout });
  },

  flushPendingProgress: async () => {
    const state = get();
    if (state.progressTimeout) {
      clearTimeout(state.progressTimeout);
    }
    const p = state.pendingProgress;
    set({ pendingProgress: null, progressTimeout: null });
    
    if (!p) return;

    try {
      const submittedAnswers = p.allAnswers.filter(
        (a): a is AnswerPayload => a !== null
      );

      const { error } = await requireSupabase().rpc('update_match_progress', {
        match_id: p.matchId,
        player_num: p.playerNumber,
        answers: submittedAnswers,
        player_done: true,
      });

      if (error) {
        console.error('Error flushing match progress:', error);
      }
    } catch (err) {
      console.error('Failed to flush match progress:', err);
    }
  },
}));

export { MULTIPLAYER_QUESTION_POOL };

