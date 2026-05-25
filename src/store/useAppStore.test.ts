import { beforeEach, beforeAll, describe, expect, test } from 'vitest';
import type { useAppStore as UseAppStoreType } from './useAppStore';

let useAppStore: typeof UseAppStoreType;

/**
 * The store module has top-level side effects (getInitialTheme reads
 * localStorage/matchMedia at import time). A dynamic import ensures these
 * run after vitest's setup file has polyfilled the globals.
 */
beforeAll(async () => {
  const mod = await import('./useAppStore');
  useAppStore = mod.useAppStore;
});

/**
 * Default state for test isolation.
 * We use a subset of the real store to reset between tests.
 * The store's initial state includes persisted data (history, badges, theme)
 * loaded from localStorage — resetting wipes that for a clean slate.
 */
function resetStore() {
  useAppStore.setState({
    practiceConfig: {
      level: 1,
      timeLimitSeconds: 120,
      seed: 'test-seed',
      overrides: {},
      questionType: 'add_sub' as const,
      adaptiveDifficulty: false,
      focusMode: false,
      dictation: false,
      source: 'practice' as const,
    },
    session: {
      status: 'idle' as const,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: null,
      finishedAt: null,
    },
    history: [],
    multiplayerHistory: [],
    badges: [],
    theme: 'light' as const,
  });

  sessionStorage.removeItem('kazoe-active-session');
}

beforeEach(() => {
  resetStore();
});

describe('session lifecycle', () => {
  test('starts in idle state', () => {
    const state = useAppStore.getState();
    expect(state.session.status).toBe('idle');
    expect(state.session.questions).toHaveLength(0);
    expect(state.history).toHaveLength(0);
  });

  test('startSession generates questions and transitions to active', () => {
    useAppStore.getState().startSession();
    const state = useAppStore.getState();

    expect(state.session.status).toBe('active');
    expect(state.session.questions.length).toBeGreaterThan(0);
    expect(state.session.currentIndex).toBe(0);
    expect(state.session.answers).toHaveLength(state.session.questions.length);
    expect(state.session.startedAt).not.toBeNull();
    expect(state.session.finishedAt).toBeNull();
  });

  test('submitAnswer increments index and records the answer', () => {
    const store = useAppStore.getState();
    store.startSession();

    useAppStore.getState().submitAnswer(42);
    const state = useAppStore.getState();

    expect(state.session.currentIndex).toBe(1);
    expect(state.session.answers[0]).toBe(42);
    expect(state.session.status).toBe('active');
  });

  test('submitAnswer with skip records "skipped"', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer('skipped');
    const state = useAppStore.getState();

    expect(state.session.currentIndex).toBe(1);
    expect(state.session.answers[0]).toBe('skipped');
  });

  test('endSession finishes the session and appends to history', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer(42);
    useAppStore.getState().submitAnswer(99);
    useAppStore.getState().endSession();

    const state = useAppStore.getState();

    expect(state.session.status).toBe('finished');
    expect(state.session.finishedAt).not.toBeNull();
    expect(state.history).toHaveLength(1);

    const entry = state.history[0]!;
    expect(entry.level).toBe(1);
    expect(entry.questionType).toBe('add_sub');
    expect(entry.isDailyChallenge).toBe(false);
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.result).toBeDefined();
    expect(entry.grade).toBeDefined();
  });

  test('endSession without answers still finishes cleanly', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().endSession();

    const state = useAppStore.getState();
    expect(state.session.status).toBe('finished');
    // When session ends with no answers, it should still finish cleanly
    expect(state.session.finishedAt).not.toBeNull();
  });

  test('submitAnswer after finish is a no-op', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer(42);
    useAppStore.getState().endSession();

    const beforeIndex = useAppStore.getState().session.currentIndex;
    useAppStore.getState().submitAnswer(99);
    expect(useAppStore.getState().session.currentIndex).toBe(beforeIndex);
  });

  test('active session is saved to sessionStorage', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer(42);

    const saved = sessionStorage.getItem('kazoe-active-session');
    expect(saved).not.toBeNull();

    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.session.status).toBe('active');
      expect(parsed.session.answers[0]).toBe(42);
    }
  });

  test('endSession clears sessionStorage', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer(42);
    useAppStore.getState().endSession();

    expect(sessionStorage.getItem('kazoe-active-session')).toBeNull();
  });
});

describe('adaptive sessions', () => {
  test('adaptive mode does not auto-finish on last question', () => {
    useAppStore.setState({
      practiceConfig: {
        level: 1,
        timeLimitSeconds: 120,
        seed: 'test-adaptive',
        overrides: {},
        questionType: 'add_sub' as const,
        adaptiveDifficulty: true,
        focusMode: false,
        dictation: false,
        source: 'practice' as const,
      },
    });

    useAppStore.getState().startSession();
    const questionCount = useAppStore.getState().session.questions.length;

    // Answer every question — adaptive mode should stay 'active'
    for (let i = 0; i < questionCount; i++) {
      useAppStore.getState().submitAnswer(0);
    }

    const state = useAppStore.getState();
    expect(state.session.status).toBe('active');
    expect(state.session.currentIndex).toBe(questionCount);
  });
});

describe('daily challenge', () => {
  test('startChallengeSession sets source to challenge', () => {
    useAppStore.getState().startChallengeSession();
    const state = useAppStore.getState();

    expect(state.session.status).toBe('active');
    expect(state.practiceConfig.source).toBe('challenge');
    expect(state.practiceConfig.timeLimitSeconds).toBe(120);
    expect(state.practiceConfig.adaptiveDifficulty).toBe(false);
  });

  test('challenge session records isDailyChallenge in history', () => {
    useAppStore.getState().startChallengeSession();
    useAppStore.getState().submitAnswer(42);
    useAppStore.getState().endSession();

    const entry = useAppStore.getState().history[0];
    if (entry) {
      expect(entry.isDailyChallenge).toBe(true);
    }
  });
});

describe('history persistence', () => {
  test('history is persisted to localStorage', () => {
    useAppStore.getState().startSession();
    useAppStore.getState().submitAnswer(42);
    useAppStore.getState().endSession();

    const raw = localStorage.getItem('kazoe-history');
    expect(raw).not.toBeNull();
    if (raw) {
      const parsed = JSON.parse(raw);
      // The versioned wrapper: { version: number, data: [...] }
      const data = parsed.data ?? parsed;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('practice config', () => {
  test('setPracticeConfig merges partial config', () => {
    useAppStore.getState().setPracticeConfig({ level: 5, timeLimitSeconds: 300 });
    const state = useAppStore.getState();

    expect(state.practiceConfig.level).toBe(5);
    expect(state.practiceConfig.timeLimitSeconds).toBe(300);
    // Other fields should keep defaults
    expect(state.practiceConfig.questionType).toBe('add_sub');
  });
});
