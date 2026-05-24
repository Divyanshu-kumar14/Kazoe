import type { HistoryEntry } from '../store/useAppStore';
import type { Grade } from './grading';

export interface AccuracyTrendPoint {
  /** Session index (0-based) */
  index: number;
  /** Accuracy percentage */
  accuracy: number;
  /** QPM (questions per minute) */
  qpm: number;
  /** Grade letter */
  grade: Grade;
  /** Session level */
  level: number;
  /** Timestamp for display */
  timestamp: number;
}

export interface LevelMastery {
  level: number;
  sessionCount: number;
  avgAccuracy: number;
  avgQpm: number;
  bestGrade: Grade;
}

export interface OperationBreakdown {
  operation: 'add_sub' | 'multiplication' | 'division';
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  sessionCount: number;
}

export interface DailyActivity {
  /** ISO date string */
  date: string;
  /** Number of sessions on that day */
  sessionCount: number;
  /** Total correct answers */
  totalCorrect: number;
}

export interface AnalyticsData {
  trend: AccuracyTrendPoint[];
  levelMastery: LevelMastery[];
  operations: OperationBreakdown[];
  dailyActivity: DailyActivity[];
  totalSessions: number;
  totalTimeMinutes: number;
  overallAccuracy: number;
  bestStreak: number;
  bestGrade: Grade;
  currentStreak: number;
}

/**
 * Compute the current streak of consecutive days with at least one session.
 */
function computeCurrentStreak(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;
  const dates = new Set<string>();
  for (const entry of history) {
    const d = new Date(entry.timestamp);
    dates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

/**
 * Computes comprehensive analytics from session history.
 */
export function computeAnalytics(history: HistoryEntry[]): AnalyticsData {
  const gradeOrder: Grade[] = ['D', 'C', 'B', 'A', 'S'];

  // Accuracy trend
  const trend: AccuracyTrendPoint[] = history.map((entry, index) => ({
    index,
    accuracy: entry.result.accuracyPercent,
    qpm: entry.result.questionsPerMinute,
    grade: entry.grade,
    level: entry.level,
    timestamp: entry.timestamp,
  }));

  // Level mastery
  const levelMap = new Map<number, { sessions: number; totalAccuracy: number; totalQpm: number; bestGradeIdx: number; gradeOrder: Grade[] }>();
  const gradeRank = new Map(gradeOrder.map((g, i) => [g, i]));

  for (const entry of history) {
    if (!levelMap.has(entry.level)) {
      levelMap.set(entry.level, { sessions: 0, totalAccuracy: 0, totalQpm: 0, bestGradeIdx: 0, gradeOrder });
    }
    const lm = levelMap.get(entry.level)!;
    lm.sessions++;
    lm.totalAccuracy += entry.result.accuracyPercent;
    lm.totalQpm += entry.result.questionsPerMinute;
    const gIdx = gradeRank.get(entry.grade) ?? 0;
    if (gIdx > lm.bestGradeIdx) lm.bestGradeIdx = gIdx;
  }

  const levelMastery: LevelMastery[] = Array.from(levelMap.entries())
    .map(([level, data]) => ({
      level,
      sessionCount: data.sessions,
      avgAccuracy: Math.round((data.totalAccuracy / data.sessions) * 10) / 10,
      avgQpm: Math.round((data.totalQpm / data.sessions) * 10) / 10,
      bestGrade: gradeOrder[data.bestGradeIdx]!,
    }))
    .sort((a, b) => a.level - b.level);

  // Operation breakdown
  // We infer operation from history: levels 1-7 are add_sub, 8-10 are mixed_all
  // For a more accurate breakdown, we'd need operation stored per session
  const opMap = new Map<'add_sub' | 'multiplication' | 'division', { attempted: number; correct: number; sessions: number }>();
  opMap.set('add_sub', { attempted: 0, correct: 0, sessions: 0 });
  opMap.set('multiplication', { attempted: 0, correct: 0, sessions: 0 });
  opMap.set('division', { attempted: 0, correct: 0, sessions: 0 });

  for (const entry of history) {
    const op = entry.questionType ?? 'add_sub' as const;
    const data = opMap.get(op);
    if (data) {
      data.attempted += entry.result.totalAttempted;
      data.correct += entry.result.totalCorrect;
      data.sessions++;
    }
  }

  // For now, all history entries are add_sub since that's the default
  const operations: OperationBreakdown[] = Array.from(opMap.entries())
    .filter(([, data]) => data.sessions > 0)
    .map(([operation, data]) => ({
      operation,
      totalAttempted: data.attempted,
      totalCorrect: data.correct,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 1000) / 10 : 0,
      sessionCount: data.sessions,
    }));

  // Daily activity (last 30 days)
  const today = new Date();
  const dayMap = new Map<string, { sessions: number; correct: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dayMap.set(key, { sessions: 0, correct: 0 });
  }
  for (const entry of history) {
    const d = new Date(entry.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dayMap.has(key)) {
      dayMap.get(key)!.sessions++;
      dayMap.get(key)!.correct += entry.result.totalCorrect;
    }
  }
  const dailyActivity: DailyActivity[] = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    sessionCount: data.sessions,
    totalCorrect: data.correct,
  }));

  // Overall stats
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalTime = 0;
  let bestStreak = 0;
  let bestGradeIdx = 0;

  for (const entry of history) {
    totalAttempted += entry.result.totalAttempted;
    totalCorrect += entry.result.totalCorrect;
    totalTime += entry.result.timeUsedSeconds;
    if (entry.result.bestStreak > bestStreak) bestStreak = entry.result.bestStreak;
    const gIdx = gradeRank.get(entry.grade) ?? 0;
    if (gIdx > bestGradeIdx) bestGradeIdx = gIdx;
  }

  return {
    trend,
    levelMastery,
    operations,
    dailyActivity,
    totalSessions: history.length,
    totalTimeMinutes: Math.round(totalTime / 60),
    overallAccuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 1000) / 10 : 0,
    bestStreak,
    bestGrade: gradeOrder[bestGradeIdx]!,
    currentStreak: computeCurrentStreak(history),
  };
}
