import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { loadDailyChallengeStatus, getTodayDate } from '../utils/dailyChallenge';
import { gradeColor } from '../utils/colors';

export default function Home() {
  const history = useAppStore((s) => s.history);
  const multiplayerHistory = useAppStore((s) => s.multiplayerHistory);
  const level = useAppStore(s => s.practiceConfig.level);
  const badges = useAppStore((s) => s.badges);

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

  // Daily challenge status
  const challengeStatus = useMemo(() => {
    const status = loadDailyChallengeStatus();
    const isToday = status.date === getTodayDate();
    const completed = isToday && status.completed && history.some(h => h.isDailyChallenge);
    return { completed };
  }, [history]);

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Daily Challenge Banner */}
        <Link
          to="/challenge"
          className="card card-interactive p-4 md:p-5 flex items-center justify-between gap-4 no-underline"
          style={{ color: 'inherit', borderLeft: '4px solid var(--color-secondary)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="size-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: challengeStatus.completed ? 'var(--color-primary-container)' : 'var(--color-secondary-container)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '24px',
                  color: challengeStatus.completed ? 'var(--color-primary)' : 'var(--color-on-secondary-container)',
                  fontVariationSettings: "'FILL' 1",
                }}
                role="img" aria-hidden="true"
              >
                {challengeStatus.completed ? 'check_circle' : 'emoji_events'}
              </span>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                {challengeStatus.completed ? "Today's Challenge Complete!" : 'Daily Challenge'}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                {challengeStatus.completed
                  ? 'You crushed it. Come back tomorrow for a new one.'
                  : 'Same questions for everyone. Complete today\'s challenge.'}
              </p>
            </div>
          </div>
          <span
            className="flex items-center gap-1 text-sm font-bold flex-shrink-0"
            style={{ color: 'var(--color-primary)' }}
          >
            {challengeStatus.completed ? 'View' : 'Start'}
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }} role="img" aria-hidden="true">arrow_forward</span>
          </span>
        </Link>

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

            {hasHistory && (
              <Link
                to="/analytics"
                className="card card-interactive p-5 flex items-center gap-4 no-underline"
                style={{ color: 'inherit' }}
              >
                <div className="size-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface-container)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">
                    query_stats
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
                    Detailed Analytics
                  </h3>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                    Trends, level mastery, and performance breakdowns
                  </p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>

        <QuickLinks />
      </div>
    </div>
  );
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
