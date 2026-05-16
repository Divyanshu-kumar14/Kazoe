import { create } from 'zustand';
import { SOROBAN_LEVELS, type LevelConfig } from '../utils/levelConfig';
import { generateSeed, type Question, generateQuestions } from '../utils/questionGenerator';
import { computeSessionResult, type SessionResult, type Grade } from '../utils/grading';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('abacus-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') document.documentElement.classList.add('dark');
}

// --- Session History (persisted to localStorage) ---
export interface HistoryEntry {
  id: string;
  timestamp: number;         // Date.now() when session finished
  level: number;
  result: SessionResult;
  grade: Grade;
}

const HISTORY_KEY = 'abacus-history';

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(history: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// --- Practice Config State ---
interface PracticeConfig {
  level: number;
  timeLimitSeconds: number;
  seed: string;
  overrides: Partial<LevelConfig>; // manual param overrides over level preset
}

// --- Active Session State ---
interface SessionState {
  status: 'idle' | 'active' | 'finished';
  questions: Question[];
  currentIndex: number;
  answers: (number | 'skipped' | null)[];
  startedAt: number | null;
  finishedAt: number | null;
}

interface AppStore {
  practiceConfig: PracticeConfig;
  session: SessionState;
  history: HistoryEntry[];
  theme: 'light' | 'dark';
  // Actions
  setPracticeConfig: (c: Partial<PracticeConfig>) => void;
  startSession: () => void;
  submitAnswer: (answer: number | 'skipped') => void;
  endSession: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  clearHistory: () => void;
}

/** Read URL params on store init — enables shareable links */
function readURLParams(): Partial<PracticeConfig> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    ...(params.get('level') && { level: Number(params.get('level')) }),
    ...(params.get('time')  && { timeLimitSeconds: Number(params.get('time')) }),
    ...(params.get('seed')  && { seed: params.get('seed')! }),
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  practiceConfig: {
    level: 1,
    timeLimitSeconds: 120,
    seed: generateSeed(),
    overrides: {},
    ...readURLParams(),   // URL params win over defaults
  },
  session: {
    status: 'idle',
    questions: [],
    currentIndex: 0,
    answers: [],
    startedAt: null,
    finishedAt: null,
  },
  history: loadHistory(),
  theme: initialTheme,
  
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('abacus-theme', theme);
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },

  setPracticeConfig: (c) =>
    set((s) => ({ practiceConfig: { ...s.practiceConfig, ...c } })),

  startSession: () => {
    const { practiceConfig } = get();
    const config = {
      ...SOROBAN_LEVELS[practiceConfig.level],
      ...practiceConfig.overrides,
    };
    const maxQuestions = Math.max(50, Math.ceil(practiceConfig.timeLimitSeconds * 2));
    const questions = generateQuestions(config, maxQuestions, practiceConfig.seed);
    set({ session: {
      status: 'active',
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: Date.now(),
      finishedAt: null,
    }});
  },

  submitAnswer: (answer) => {
    const state = get();
    if (state.session.status === 'finished') return;
    const answers = [...state.session.answers];
    answers[state.session.currentIndex] = answer;
    const nextIndex = state.session.currentIndex + 1;
    const finished = nextIndex >= state.session.questions.length;
    const finishedAt = finished ? Date.now() : null;

    const newSession = {
      ...state.session,
      answers,
      currentIndex: nextIndex,
      status: (finished ? 'finished' : 'active') as SessionState['status'],
      finishedAt,
    };

    // Auto-save to history when all questions answered
    if (finished && state.session.startedAt && finishedAt) {
      const levelConfig = {
        ...SOROBAN_LEVELS[state.practiceConfig.level],
        ...state.practiceConfig.overrides,
      };
      const result = computeSessionResult(
        answers, state.session.questions, levelConfig,
        state.session.startedAt, finishedAt
      );
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: finishedAt,
        level: state.practiceConfig.level,
        result,
        grade: result.grade,
      };
      const updated = [...state.history, entry];
      saveHistory(updated);
      set({ session: newSession, history: updated });
    } else {
      set({ session: newSession });
    }
  },

  endSession: () => {
    const state = get();
    const finishedAt = Date.now();

    // Save to history if session had meaningful attempts
    if (state.session.startedAt && state.session.status === 'active') {
      const answered = state.session.answers.filter(a => a !== null).length;
      if (answered > 0) {
        const levelConfig = {
          ...SOROBAN_LEVELS[state.practiceConfig.level],
          ...state.practiceConfig.overrides,
        };
        const result = computeSessionResult(
          state.session.answers, state.session.questions, levelConfig,
          state.session.startedAt, finishedAt
        );
        const entry: HistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: finishedAt,
          level: state.practiceConfig.level,
          result,
          grade: result.grade,
        };
        const updated = [...state.history, entry];
        saveHistory(updated);
        set({
          session: { ...state.session, status: 'finished', finishedAt },
          history: updated,
        });
        return;
      }
    }

    set((s) => ({ session: { ...s.session, status: 'finished', finishedAt } }));
  },

  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },
}));
