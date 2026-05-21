import { Link } from 'react-router-dom';
import { StatBlock } from './StatBlock';
import type { Grade } from '../../utils/grading';

interface StatsOverviewProps {
  hasHistory: boolean;
  stats: {
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
  };
}

export function StatsOverview({ hasHistory, stats }: StatsOverviewProps) {
  return (
    <div className="card p-6 md:col-span-2 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '24px', color: 'var(--color-primary)' }}
          >
            insights
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Your Stats
          </h2>
        </div>
        {hasHistory && (
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              letterSpacing: '0.05em',
            }}
          >
            Best: {stats.bestGrade}
          </span>
        )}
      </div>

      {hasHistory ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBlock
              icon="check_circle"
              label="Accuracy"
              value={`${Math.round(stats.avgAccuracy)}%`}
            />
            <StatBlock
              icon="local_fire_department"
              label="Best Streak"
              value={`${stats.bestStreak}`}
            />
            <StatBlock
              icon="history"
              label="Sessions"
              value={`${stats.totalSessions}`}
            />
            <StatBlock
              icon="schedule"
              label="Time Spent"
              value={`${stats.totalTimeMinutes}m`}
            />
          </div>

          {/* Today's progress */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-on-surface-variant)' }}>Today's accuracy</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}>
                {stats.todayCorrect} / {stats.todayAttempted} correct
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${stats.todayAccuracy}%`,
                  backgroundColor: stats.todayAccuracy >= 80 ? 'var(--color-primary)' : 'var(--color-secondary)',
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-8 gap-3"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>
            query_stats
          </span>
          <p className="text-sm text-center" style={{ maxWidth: '280px', margin: 0 }}>
            Complete your first practice session to see your performance stats here.
          </p>
        </div>
      )}

      <Link
        to="/practice"
        className="btn-secondary w-full justify-center mt-2"
        style={{ fontWeight: 700 }}
      >
        {hasHistory ? 'Practice More' : 'Begin First Session'}
      </Link>
    </div>
  );
}
