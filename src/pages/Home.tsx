
import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Grade } from '../utils/grading';
import { AccuracySparkline } from '../components/home/AccuracySparkline';
import { BadgeGrid } from '../components/home/BadgeGrid';
import { Leaderboard } from '../components/home/Leaderboard';
import { WelcomeHeader } from '../components/home/WelcomeHeader';
import { StatsOverview } from '../components/home/StatsOverview';
import { LevelBadge } from '../components/home/LevelBadge';
import { MultiplayerDashboard } from '../components/home/MultiplayerDashboard';
import { RecentSessions } from '../components/home/RecentSessions';
import { QuickLinks } from '../components/home/QuickLinks';
const RANKS = [
  { name: 'Beginner',     minPts: 0,    icon: 'kid_star',     color: '#78909c' },
  { name: 'Novice',       minPts: 100,  icon: 'star_half',    color: '#26a69a' },
  { name: 'Apprentice',   minPts: 300,  icon: 'star',         color: '#42a5f5' },
  { name: 'Intermediate', minPts: 600,  icon: 'military_tech',color: '#ab47bc' },
  { name: 'Advanced',     minPts: 1200, icon: 'workspace_premium', color: '#ef5350' },
  { name: 'Expert',       minPts: 2000, icon: 'diamond',      color: '#ff7043' },
  { name: 'Master',       minPts: 3500, icon: 'local_fire_department', color: '#ffa726' },
  { name: 'Grandmaster',  minPts: 5000, icon: 'emoji_events', color: '#fdd835' },
] as const;

function getRank(points: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPts) return { ...RANKS[i], index: i };
  }
  return { ...RANKS[0], index: 0 };
}

function getNextRank(points: number) {
  const currentIdx = getRank(points).index;
  if (currentIdx >= RANKS.length - 1) return null;
  return RANKS[currentIdx + 1];
}

const DAILY_GOAL = 5; // sessions per day



export default function Home() {
  const history = useAppStore((s) => s.history);
  const multiplayerHistory = useAppStore((s) => s.multiplayerHistory);
  const level = useAppStore(s => s.practiceConfig.level);
  const badges = useAppStore((s) => s.badges);

  const stats = useMemo(() => {
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
  }, [history, multiplayerHistory]);

  const mpStats = useMemo(() => {
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
  }, [multiplayerHistory]);

  const sparklineData = useMemo(() => history.slice(-20), [history]);
  const badgeIds = useMemo(() => badges.map(b => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, unlocked: b.unlocked, unlockedAt: b.unlockedAt })), [badges]);
  const hasHistory = stats.totalSessions > 0;
  const hasMultiplayerHistory = mpStats.totalMatches > 0;

  const rank = getRank(stats.totalPoints);
  const nextRank = getNextRank(stats.totalPoints);
  const goalProgress = Math.min(stats.todaySessions / DAILY_GOAL, 1);
  const goalPercent = Math.round(goalProgress * 100);

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        <WelcomeHeader
          hasHistory={hasHistory}
          todaySessions={stats.todaySessions}
          avgAccuracy={stats.avgAccuracy}
          totalSessions={stats.totalSessions}
          goalProgress={goalProgress}
          goalPercent={goalPercent}
          DAILY_GOAL={DAILY_GOAL}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsOverview hasHistory={hasHistory} stats={stats as React.ComponentProps<typeof StatsOverview>['stats']} />
          <LevelBadge level={level} totalPoints={stats.totalPoints} rank={rank} nextRank={nextRank} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MultiplayerDashboard
              hasMultiplayerHistory={hasMultiplayerHistory}
              mpStats={mpStats}
              formatTimeAgo={formatTimeAgo}
            />

            {hasHistory && (
              <div className="card p-6 flex flex-col gap-6">
                <AccuracySparkline history={sparklineData} />
                <div className="border-t" style={{ borderColor: 'var(--color-outline-variant)', margin: 0 }} />
                <BadgeGrid badges={badgeIds} />
              </div>
            )}

            <RecentSessions
              last5={stats.last5}
              formatTimeAgo={formatTimeAgo}
              gradeColor={gradeColor}
            />
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <Leaderboard userScore={stats.totalPoints} />
          </div>
        </div>

        <QuickLinks />
      </div>
    </div>
  );
}



function gradeColor(grade: Grade) {
  switch (grade) {
    case 'S': return '#f59e0b';
    case 'A': return '#10b981';
    case 'B': return '#3b82f6';
    case 'C': return '#8b5cf6';
    default:  return '#6b7280';
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
