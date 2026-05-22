
import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AccuracySparkline } from '../components/home/AccuracySparkline';
import { BadgeGrid } from '../components/home/BadgeGrid';
import { Leaderboard } from '../components/home/Leaderboard';
import { WelcomeHeader } from '../components/home/WelcomeHeader';
import { StatsOverview } from '../components/home/StatsOverview';
import { LevelBadge } from '../components/home/LevelBadge';
import { MultiplayerDashboard } from '../components/home/MultiplayerDashboard';
import { RecentSessions } from '../components/home/RecentSessions';
import { QuickLinks } from '../components/home/QuickLinks';
import { getRank, getNextRank, computeStats, computeMultiplayerStats, DAILY_GOAL } from '../utils/stats';
import type { Grade } from '../utils/grading';

export default function Home() {
  const store = useAppStore;
  const history = store((s) => s.history);
  const multiplayerHistory = store((s) => s.multiplayerHistory);
  const level = store(s => s.practiceConfig.level);
  const badges = store((s) => s.badges);

  const stats = useMemo(() => computeStats(history, multiplayerHistory), [history, multiplayerHistory]);

  const mpStats = useMemo(() => computeMultiplayerStats(multiplayerHistory), [multiplayerHistory]);

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
