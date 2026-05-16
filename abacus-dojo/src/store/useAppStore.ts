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

// --- Achievement Badges ---
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

const ALL_BADGES: Omit<Badge, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_session', name: 'First Steps', description: 'Complete your first session', icon: 'kid_star' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% accuracy', icon: 'stars' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Earn an S grade', icon: 'bolt' },
  { id: 'streak_5', name: 'On Fire', description: 'Achieve a 5-correct streak', icon: 'local_fire_department' },
  { id: 'streak_10', name: 'Unstoppable', description: 'Achieve a 10-correct streak', icon: 'whatshot' },
  { id: 'ten_sessions', name: 'Dedicated', description: 'Complete 10 sessions', icon: 'workspace_premium' },
  { id: 'century', name: 'Century', description: 'Answer 100 questions correctly total', icon: 'military_tech' },
];

const ACHIEVEMENTS_KEY = 'abacus-achievements';

function loadAchievements(): Badge[] {
  if (typeof window === 'undefined') return ALL_BADGES.map(b => ({ ...b, unlocked: false, unlockedAt: null }));
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Badge[];
      return ALL_BADGES.map(b => saved.find(s => s.id === b.id) || { ...b, unlocked: false, unlockedAt: null });
    }
  } catch { /* ignore */ }
  return ALL_BADGES.map(b => ({ ...b, unlocked: false, unlockedAt: null }));
}

function saveAchievements(badges: Badge[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(badges));
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
  badges: Badge[];
  theme: 'light' | 'dark';
  // Actions
  setPracticeConfig: (c: Partial<PracticeConfig>) => void;
  startSession: () => void;
  submitAnswer: (answer: number | 'skipped') => void;
  endSession: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  clearHistory: () => void;
  unlockBadges: () => void;
}

/** Read URL params on store init — enables shareable links */
function readURLParams(): Partial<PracticeConfig> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<PracticeConfig> = {};
  const levelParam = params.get('level');
  if (levelParam) {
    const level = Number(levelParam);
    if (!isNaN(level) && level >= 1 && level <= 20) result.level = level;
  }
  const timeParam = params.get('time');
  if (timeParam) {
    const time = Number(timeParam);
    if (!isNaN(time) && time > 0 && time <= 600) result.timeLimitSeconds = time;
  }
  const seedParam = params.get('seed');
  if (seedParam) result.seed = seedParam;
  return result;
}

function computeBadgeUpdates(badges: Badge[], history: HistoryEntry[]): Badge[] {
  let tsOffset = 0;
  const totalCorrect = history.reduce((s, h) => s + h.result.totalCorrect, 0);
  const bestStreak = history.length > 0 ? Math.max(...history.map(h => h.result.bestStreak)) : 0;
  const bestGrade = history.reduce<Grade | null>((best, h) => {
    const order = ['D', 'C', 'B', 'A', 'S'];
    if (!best || order.indexOf(h.grade) > order.indexOf(best)) return h.grade;
    return best;
  }, null);

  return badges.map(b => {
    if (b.unlocked) return b;
    let unlock = false;
    switch (b.id) {
      case 'first_session': unlock = history.length >= 1; break;
      case 'perfect_score': unlock = history.some(h => h.result.accuracyPercent === 100); break;
      case 'speed_demon': unlock = bestGrade === 'S'; break;
      case 'streak_5': unlock = bestStreak >= 5; break;
      case 'streak_10': unlock = bestStreak >= 10; break;
      case 'ten_sessions': unlock = history.length >= 10; break;
      case 'century': unlock = totalCorrect >= 100; break;
    }
    if (unlock) {
      tsOffset++;
      return { ...b, unlocked: true, unlockedAt: Date.now() + tsOffset };
    }
    return b;
  });
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
  badges: loadAchievements(),
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
    const seed = generateSeed();
    const config = {
      ...SOROBAN_LEVELS[practiceConfig.level],
      ...practiceConfig.overrides,
    };
    const maxQuestions = Math.max(50, Math.ceil(practiceConfig.timeLimitSeconds * 2));
    const questions = generateQuestions(config, maxQuestions, seed);
    set((s) => ({
      practiceConfig: { ...s.practiceConfig, seed },
      session: {
      status: 'active',
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: Date.now(),
      finishedAt: null,
    }}));
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
      const updatedBadges = computeBadgeUpdates(state.badges, updated);
      saveAchievements(updatedBadges);
      set({ session: newSession, history: updated, badges: updatedBadges });
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
        const updatedBadges = computeBadgeUpdates(state.badges, updated);
        saveAchievements(updatedBadges);
        set({
          session: { ...state.session, status: 'finished', finishedAt },
          history: updated,
          badges: updatedBadges,
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

  unlockBadges: () => {
    const { badges, history } = get();
    const updated = computeBadgeUpdates(badges, history);
    saveAchievements(updated);
    set({ badges: updated });
  },
}));
