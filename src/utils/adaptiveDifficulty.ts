import { SOROBAN_LEVELS, type LevelConfig } from './levelConfig';
import { generateQuestion, type Question } from './questionGenerator';

/**
 * Adaptive difficulty configuration.
 */
export interface AdaptiveState {
  /** Current difficulty offset from base level (-1, 0, +1) */
  offset: number;
  /** Rolling window of recent answer correctness */
  recentCorrect: boolean[];
  /** Rolling window of recent answer times (ms) */
  recentTimes: number[];
  /** Window size for adaptive decisions */
  windowSize: number;
  /** Questions generated at current difficulty */
  questionBuffer: Question[];
  /** Number of questions to pre-generate at a time */
  bufferSize: number;
}

/**
 * Creates an initial adaptive state.
 */
export function createAdaptiveState(bufferSize = 10, windowSize = 5): AdaptiveState {
  return {
    offset: 0,
    recentCorrect: [],
    recentTimes: [],
    windowSize,
    questionBuffer: [],
    bufferSize,
  };
}

/**
 * Computes the effective level config based on base level and offset.
 */
export function getAdaptiveConfig(baseLevel: number, offset: number, questionType: 'add_sub' | 'multiplication' | 'division'): LevelConfig {
  const base = SOROBAN_LEVELS[baseLevel]!;
  const effectiveLevel = Math.max(1, Math.min(10, baseLevel + offset));

  if (effectiveLevel !== baseLevel) {
    const adjusted = SOROBAN_LEVELS[effectiveLevel]!;
    return {
      ...adjusted,
      // Use the question type from the session
      operations: questionType === 'add_sub' ? adjusted.operations
        : questionType === 'multiplication' ? 'multiplication'
        : 'division',
    };
  }

  return {
    ...base,
    operations: questionType === 'add_sub' ? base.operations
      : questionType === 'multiplication' ? 'multiplication'
      : 'division',
  };
}

/**
 * Adjusts difficulty based on recent performance.
 * Returns new offset (clamped to -2..+2 relative to base).
 */
export function recalculateOffset(
  state: AdaptiveState,
): number {
  const { recentCorrect, recentTimes, windowSize } = state;

  if (recentCorrect.length < windowSize) return state.offset;

  // Look at the last N results
  const recentSlice = recentCorrect.slice(-windowSize);
  const recentTimeSlice = recentTimes.slice(-windowSize);

  const correctCount = recentSlice.filter(Boolean).length;
  const accuracy = correctCount / windowSize;

  const avgTime = recentTimeSlice.reduce((a, b) => a + b, 0) / recentTimeSlice.length;

  // Speed threshold: if avg time per question is very fast (< 3s), consider increasing difficulty
  const isFast = avgTime < 3000;
  // Time threshold: if avg time is very slow (> 15s), consider decreasing difficulty
  const isSlow = avgTime > 15000;

  let newOffset = state.offset;

  if (accuracy >= 0.9 && isFast) {
    // Doing great: increase difficulty
    newOffset = Math.min(2, newOffset + 1);
  } else if (accuracy >= 0.8 && isFast) {
    // Good accuracy with speed: bump up
    newOffset = Math.min(2, newOffset + 1);
  } else if (accuracy < 0.5) {
    // Struggling: decrease difficulty
    newOffset = Math.max(-2, newOffset - 1);
  } else if (accuracy < 0.65 && isSlow) {
    // Below average and slow: ease up
    newOffset = Math.max(-2, newOffset - 1);
  }

  return newOffset;
}

/**
 * Records an answer result and time, then recalculates difficulty.
 * Returns the updated adaptive state with a fresh question buffer if needed.
 */
export function recordAnswer(
  state: AdaptiveState,
  isCorrect: boolean,
  timeMs: number,
  baseLevel: number,
  questionType: 'add_sub' | 'multiplication' | 'division',
): AdaptiveState {
  const newCorrect = [...state.recentCorrect, isCorrect].slice(-state.windowSize * 2);
  const newTimes = [...state.recentTimes, timeMs].slice(-state.windowSize * 2);

  const newOffset = recalculateOffset(
    { ...state, recentCorrect: newCorrect, recentTimes: newTimes },
  );

  // Only refill buffer if offset changed or buffer is empty
  const needsRefill = newOffset !== state.offset || state.questionBuffer.length <= 1;

  let newBuffer = state.questionBuffer;
  if (needsRefill) {
    const config = getAdaptiveConfig(baseLevel, newOffset, questionType);
    newBuffer = [];
    for (let i = 0; i < state.bufferSize; i++) {
      newBuffer.push(generateQuestion(config));
    }
  }

  return {
    ...state,
    offset: newOffset,
    recentCorrect: newCorrect,
    recentTimes: newTimes,
    questionBuffer: newBuffer,
  };
}

/**
 * Pops the next question from the buffer, refilling if necessary.
 */
export function popQuestion(
  state: AdaptiveState,
  baseLevel: number,
  questionType: 'add_sub' | 'multiplication' | 'division',
): { question: Question; state: AdaptiveState } {
  if (state.questionBuffer.length === 0) {
    const config = getAdaptiveConfig(baseLevel, state.offset, questionType);
    const newBuffer = [];
    for (let i = 0; i < state.bufferSize; i++) {
      newBuffer.push(generateQuestion(config));
    }
    const question = newBuffer.shift()!;
    return {
      question,
      state: { ...state, questionBuffer: newBuffer },
    };
  }

  const question = state.questionBuffer.shift()!;
  return {
    question,
    state: { ...state, questionBuffer: state.questionBuffer },
  };
}
