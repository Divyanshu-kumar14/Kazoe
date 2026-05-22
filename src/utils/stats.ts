import type { Grade } from './grading';
import type { HistoryEntry, MultiplayerHistoryEntry } from '../store/useAppStore';

export const RANKS = [
  { name: 'Beginner',     minPts: 0,    icon: 'kid_star',     color: '#78909c' },
  { name: 'Novice',       minPts: 100,  icon: 'star_half',    color: '#26a69a' },
  { name: 'Apprentice',   minPts: 300,  icon: 'star',         color: '#42a5f5' },
  { name: 'Intermediate', minPts: 600,  icon: 'military_tech',color: '#ab47bc' },
  { name: 'Advanced',     minPts: 1200, icon: 'workspace_premium', color: '#ef5350' },
  { name: 'Expert',       minPts: 2000, icon: 'diamond',      color: '#ff7043' },
  { name: 'Master',       minPts: 3500, icon: 'local_fire_department', color: '#ffa726' },
  { name: 'Grandmaster',  minPts: 5000, icon: 'emoji_events', color: '#fdd835' },
] as const;

export const DAILY_GOAL = 5;

export interface DashboardStats {
  totalSessions: number;
  totalCorrect: number;
  totalAttempted: number;
  avgAccuracy: number;
  bestStreak: number;
  totalPoints: number;
  totalTimeMinutes: number;
  bestGrade: Grade;
  recentLevel: number;
  todaySessions: number;
  todayCorrect: number;
  todayAttempted: number;
  todayAccuracy: number;
  last5: HistoryEntry[];
}

export interface MultiplayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgAccuracy: number;
  last5: MultiplayerHistoryEntry[];
}

export function getRank(points: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPts) return { ...RANKS[i], index: i };
  }
  return { ...RANKS[0], index: 0 };
}

export function getNextRank(points: number) {
  const currentIdx = getRank(points).index;
  if (currentIdx >= RANKS.length - 1) return null;
  return RANKS[currentIdx + 1];
}

export function computeStats(history: HistoryEntry[], multiplayerHistory: MultiplayerHistoryEntry[]): DashboardStats {
  const gradeOrder: Grade[] = ['D', 'C', 'B', 'A', 'S'];
  const gradeBonus: Record<Grade, number> = { S: 50, A: 30, B: 15, C: 5, D: 0 };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCutoff = todayStart.getTime();

  let totalCorrect = 0;
  let totalAttempted = 0;
  let bestStreak = 0;
  let totalTimeSeconds = 0;
  let totalPoints = 0;
  let bestGradeIdx = 0;
  let todayCorrect = 0;
  let todayAttempted = 0;
  let todaySessions = 0;

  const gradeRank = new Map(gradeOrder.map((g, i) => [g, i]));

  for (const entry of history) {
    const { totalCorrect: entryCorrect, totalAttempted: entryAttempted, bestStreak: entryStreak, timeUsedSeconds: entryTime } = entry.result;
    totalCorrect += entryCorrect;
    totalAttempted += entryAttempted;
    if (entryStreak > bestStreak) bestStreak = entryStreak;
    totalTimeSeconds += entryTime;
    totalPoints += entryCorrect * 10 + (gradeBonus[entry.grade] || 0);
    const gradeIndex = gradeRank.get(entry.grade) ?? 0;
    if (gradeIndex > bestGradeIdx) bestGradeIdx = gradeIndex;

    if (entry.timestamp >= todayCutoff) {
      todaySessions++;
      todayCorrect += entryCorrect;
      todayAttempted += entryAttempted;
    }
  }

  for (const match of multiplayerHistory) {
    if (match.isWinner) totalPoints += 50;
    else if (match.isDraw) totalPoints += 25;
    else totalPoints += 10;
  }

  const avgAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const todayAccuracy = todayAttempted > 0 ? (todayCorrect / todayAttempted) * 100 : 0;
  const last5 = history.slice(-5).reverse();

  return {
    totalSessions: history.length,
    totalCorrect,
    totalAttempted,
    avgAccuracy,
    bestStreak,
    totalPoints,
    totalTimeMinutes: Math.round(totalTimeSeconds / 60),
    bestGrade: gradeOrder[bestGradeIdx],
    recentLevel: history.length > 0 ? history[history.length - 1].level : 1,
    todaySessions,
    todayCorrect,
    todayAttempted,
    todayAccuracy,
    last5,
  };
}

export function computeMultiplayerStats(multiplayerHistory: MultiplayerHistoryEntry[]): MultiplayerStats {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalAccuracy = 0;

  for (const match of multiplayerHistory) {
    if (match.isWinner) wins++;
    else if (match.isDraw) draws++;
    else losses++;

    totalAccuracy += match.myAccuracy;
  }

  const totalMatches = multiplayerHistory.length;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const avgAccuracy = totalMatches > 0 ? totalAccuracy / totalMatches : 0;
  const last5 = multiplayerHistory.slice(-5).reverse();

  return {
    totalMatches,
    wins,
    losses,
    draws,
    winRate,
    avgAccuracy,
    last5,
  };
}
