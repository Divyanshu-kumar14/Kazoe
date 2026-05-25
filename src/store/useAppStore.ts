import { create } from 'zustand';
import { SOROBAN_LEVELS, type LevelConfig } from '../utils/levelConfig';
import { generateSeed, type Question, generateQuestions } from '../utils/questionGenerator';
import { computeSessionResult, type SessionResult, type Grade } from '../utils/grading';
import { getDailySeed } from '../utils/dailyChallenge';
import { loadItem, saveItem } from '../lib/storage';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('kazoe-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light'; // Test environments may not have matchMedia
  }
}

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') document.documentElement.classList.add('dark');
}

export interface HistoryEntry {
  id: string;
  timestamp: number;         // Date.now() when session finished
  level: number;
  result: SessionResult;
  grade: Grade;
  questionType?: 'add_sub' | 'multiplication' | 'division';
  isDailyChallenge?: boolean;
}

const HISTORY_KEY = 'kazoe-history';

function loadHistory(): HistoryEntry[] {
  return loadItem<HistoryEntry[]>(HISTORY_KEY, []);
}

function saveHistory(history: HistoryEntry[]) {
  saveItem(HISTORY_KEY, history);
}

export interface MultiplayerHistoryEntry {
  id: string;
  timestamp: number;
  isWinner: boolean;
  isDraw: boolean;
  myScore: number;
  oppScore: number;
  myAccuracy: number;
  oppAccuracy: number;
  myTime: number;
  oppTime: number;
}

const MP_HISTORY_KEY = 'kazoe-multiplayer-history';

function loadMultiplayerHistory(): MultiplayerHistoryEntry[] {
  return loadItem<MultiplayerHistoryEntry[]>(MP_HISTORY_KEY, []);
}

function saveMultiplayerHistory(history: MultiplayerHistoryEntry[]) {
  saveItem(MP_HISTORY_KEY, history);
}

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

const ACHIEVEMENTS_KEY = 'kazoe-achievements';

function loadAchievements(): Badge[] {
  if (typeof window === 'undefined') return ALL_BADGES.map(b => ({ ...b, unlocked: false, unlockedAt: null }));
  try {
    const saved = loadItem<Badge[]>(ACHIEVEMENTS_KEY, []);
    if (saved.length > 0) {
      const savedMap = new Map(saved.map(s => [s.id, s]));
      return ALL_BADGES.map(b => savedMap.get(b.id) || { ...b, unlocked: false, unlockedAt: null });
    }
  } catch { /* ignore */ }
  return ALL_BADGES.map(b => ({ ...b, unlocked: false, unlockedAt: null }));
}

function saveAchievements(badges: Badge[]) {
  saveItem(ACHIEVEMENTS_KEY, badges);
}

const SESSION_KEY = 'kazoe-active-session';

interface SavedSessionData {
  session: SessionState;
  practiceConfig: PracticeConfig;
}

function saveSessionToStorage(data: { session: SessionState; practiceConfig: PracticeConfig }) {
  if (typeof window === 'undefined') return;
  if (data.session.status !== 'active') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded — silently drop
  }
}

function clearSessionStorage() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

function restoreSessionFromStorage(): SavedSessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedSessionData;
    if (saved.session.status !== 'active') return null;
    if (!saved.session.startedAt || Date.now() - saved.session.startedAt > 3600000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (!saved.session.questions || saved.session.questions.length === 0) return null;
    return saved;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

interface PracticeConfig {
  level: number;
  timeLimitSeconds: number;
  seed: string;
  overrides: Partial<LevelConfig>; // manual param overrides over level preset
  questionType: 'add_sub' | 'multiplication' | 'division';
  adaptiveDifficulty?: boolean;
  focusMode?: boolean;
  dictation?: boolean;
  source?: 'practice' | 'challenge';
}

interface SessionState {
  status: 'idle' | 'active' | 'finished';
  questions: Question[];
  currentIndex: number;
  answers: (number | 'skipped' | null)[];
  startedAt: number | null;
  finishedAt: number | null;
}

const INITIAL_BUFFER_SIZE = 50;

interface AppStore {
  practiceConfig: PracticeConfig;
  session: SessionState;
  history: HistoryEntry[];
  multiplayerHistory: MultiplayerHistoryEntry[];
  badges: Badge[];
  theme: 'light' | 'dark';
  // Actions
  setPracticeConfig: (c: Partial<PracticeConfig>) => void;
  startSession: () => void;
  submitAnswer: (answer: number | 'skipped') => void;
  endSession: () => void;
  extendQuestions: (newQuestions: Question[]) => void;
  startChallengeSession: () => void;
  saveMultiplayerMatch: (entry: MultiplayerHistoryEntry) => void;
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
    if (!isNaN(level) && level >= 1 && level <= 10) result.level = level;
  }
  const timeParam = params.get('time');
  if (timeParam) {
    const time = Number(timeParam);
    if (!isNaN(time) && time > 0 && time <= 600) result.timeLimitSeconds = time;
  }
  const seedParam = params.get('seed');
  if (seedParam) result.seed = seedParam;
  const typeParam = params.get('type');
  if (typeParam === 'add_sub' || typeParam === 'multiplication' || typeParam === 'division') {
    result.questionType = typeParam;
  }
  return result;
}

function computeBadgeUpdates(badges: Badge[], history: HistoryEntry[]): Badge[] {
  let tsOffset = 0;
  let totalCorrect = 0;
  let bestStreak = 0;
  let bestGrade: Grade | null = null;
  const gradeOrder = ['D', 'C', 'B', 'A', 'S'] as const;
  const gradeRank = new Map(gradeOrder.map((g, i) => [g, i]));

  for (const entry of history) {
    totalCorrect += entry.result.totalCorrect;
    if (entry.result.bestStreak > bestStreak) bestStreak = entry.result.bestStreak;
    if (!bestGrade || (gradeRank.get(entry.grade) ?? 0) > (gradeRank.get(bestGrade) ?? 0)) bestGrade = entry.grade;
  }

  return badges.map(badge => {
    if (badge.unlocked) return badge;
    let unlock = false;
    switch (badge.id) {
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
      return { ...badge, unlocked: true, unlockedAt: Date.now() + tsOffset };
    }
    return badge;
  });
}

export const useAppStore = create<AppStore>((set, get) => {
  function finalizeSession(
    state: AppStore,
    answers: (number | 'skipped' | null)[],
    session: SessionState,
    finishedAt: number
  ) {
    const levelConfig = {
      ...SOROBAN_LEVELS[state.practiceConfig.level]!,
      ...state.practiceConfig.overrides,
    };
    const result = computeSessionResult(
      answers, session.questions, levelConfig,
      session.startedAt!, finishedAt
    );
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: finishedAt,
      level: state.practiceConfig.level,
      result,
      grade: result.grade,
      questionType: state.practiceConfig.questionType,
      isDailyChallenge: state.practiceConfig.source === 'challenge',
    };
    const updated = [...state.history, entry];
    saveHistory(updated);

    // Update UI immediately — show the session result without delay
    set({
      session: { ...session, status: 'finished', finishedAt },
      history: updated,
    });
    clearSessionStorage();

    // Defer badge computation to avoid blocking the result screen render.
    // Badge scanning accesses all history — with hundreds of entries this
    // is fast, but it shouldn't block the critical path.
    queueMicrotask(() => {
      const currentState = get();
      const updatedBadges = computeBadgeUpdates(currentState.badges, currentState.history);
      saveAchievements(updatedBadges);
      set({ badges: updatedBadges });
    });
  }

  const restored = restoreSessionFromStorage();

  return {
    practiceConfig: restored?.practiceConfig ?? {
      level: 1,
      timeLimitSeconds: 120,
      seed: generateSeed(),
      overrides: {},
      questionType: 'add_sub',
      adaptiveDifficulty: false,
      focusMode: false,
      dictation: false,
      source: 'practice',
      ...readURLParams(),
    },
    session: restored?.session ?? {
      status: 'idle',
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: null,
      finishedAt: null,
    },
    history: loadHistory(),
    multiplayerHistory: loadMultiplayerHistory(),
    badges: loadAchievements(),
    theme: initialTheme,

    saveMultiplayerMatch: (entry) => {
      set((state) => {
        if (state.multiplayerHistory.some(h => h.id === entry.id)) return state;
        const newHistory = [...state.multiplayerHistory, entry];
        saveMultiplayerHistory(newHistory);
        return { multiplayerHistory: newHistory };
      });
    },

    setTheme: (theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kazoe-theme', theme);
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
        ...SOROBAN_LEVELS[practiceConfig.level]!,
        ...practiceConfig.overrides,
      };

      if (practiceConfig.adaptiveDifficulty) {
        // Adaptive mode: generate initial buffer
        const questions = generateQuestions(config, INITIAL_BUFFER_SIZE, seed, practiceConfig.questionType);
        set((s) => ({
          practiceConfig: { ...s.practiceConfig, seed },
          session: {
            status: 'active',
            questions,
            currentIndex: 0,
            answers: new Array(questions.length).fill(null),
            startedAt: Date.now(),
            finishedAt: null,
          }
        }));
        saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
      } else {
        // Standard mode: generate all questions upfront
        const maxQuestions = Math.max(50, Math.ceil(practiceConfig.timeLimitSeconds * 2));
        const questions = generateQuestions(config, maxQuestions, seed, practiceConfig.questionType);
        set((s) => ({
          practiceConfig: { ...s.practiceConfig, seed },
          session: {
            status: 'active',
            questions,
            currentIndex: 0,
            answers: new Array(questions.length).fill(null),
            startedAt: Date.now(),
            finishedAt: null,
          }
        }));
        saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
      }
    },

    startChallengeSession: () => {
      const { practiceConfig } = get();
      const dailySeed = getDailySeed();
      const config = SOROBAN_LEVELS[practiceConfig.level]!;
      const maxQuestions = Math.max(50, Math.ceil(120 * 2));
      const questions = generateQuestions(config, maxQuestions, dailySeed, practiceConfig.questionType);
      set((s) => ({
        practiceConfig: {
          ...s.practiceConfig,
          seed: dailySeed,
          source: 'challenge',
          timeLimitSeconds: 120,
          adaptiveDifficulty: false,
          overrides: {},
        },
        session: {
          status: 'active',
          questions,
          currentIndex: 0,
          answers: new Array(questions.length).fill(null),
          startedAt: Date.now(),
          finishedAt: null,
        }
      }));
      saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
    },

    submitAnswer: (answer) => {
      const state = get();
      if (state.session.status === 'finished') return;

      const isAdaptive = state.practiceConfig.adaptiveDifficulty;
      const answers = [...state.session.answers];
      answers[state.session.currentIndex] = answer;
      const nextIndex = state.session.currentIndex + 1;

      if (isAdaptive) {
        // Adaptive mode: never auto-finish from questions count.
        // The session ends only via time-up (endSession) or manual end.
        // The useAdaptiveSession hook manages buffer extension at the correct difficulty.
        set({
          session: {
            ...state.session,
            answers,
            currentIndex: nextIndex,
            status: 'active',
          },
        });
        saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
      } else {
        // Standard mode: auto-finish when all questions answered
        const finished = nextIndex >= state.session.questions.length;
        const finishedAt = finished ? Date.now() : null;

        if (finished && state.session.startedAt && finishedAt) {
          finalizeSession(state, answers, state.session, finishedAt);
        } else {
          set({
            session: {
              ...state.session,
              answers,
              currentIndex: nextIndex,
              status: finished ? 'finished' : 'active',
              finishedAt,
            },
          });
          if (!finished) {
            saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
          }
        }
      }
    },

    extendQuestions: (newQuestions) => {
      const wasActive = get().session.status === 'active';
      set((state) => {
        if (state.session.status !== 'active') return state;
        return {
          session: {
            ...state.session,
            questions: [...state.session.questions, ...newQuestions],
            answers: [...state.session.answers, ...new Array(newQuestions.length).fill(null)],
          },
        };
      });
      if (wasActive) {
        saveSessionToStorage({ session: get().session, practiceConfig: get().practiceConfig });
      }
    },

    endSession: () => {
      const state = get();
      const finishedAt = Date.now();
      if (state.session.startedAt && state.session.status === 'active') {
        const answered = state.session.answers.filter(a => a !== null).length;
        if (answered > 0) {
          finalizeSession(state, state.session.answers, state.session, finishedAt);
          return;
        }
      }
      set((s) => ({ session: { ...s.session, status: 'finished', finishedAt } }));
      clearSessionStorage();
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
  };
});
