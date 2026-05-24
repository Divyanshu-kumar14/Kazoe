import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { computeAnalytics } from '../utils/analytics';
import AccuracyTrendChart from '../components/analytics/AccuracyTrendChart';
import LevelMasteryChart from '../components/analytics/LevelMasteryChart';
import ActivityHeatmap from '../components/analytics/ActivityHeatmap';
import OperationBreakdown from '../components/analytics/OperationBreakdown';

export default function Analytics() {
  const history = useAppStore((s) => s.history);

  const analytics = useMemo(() => computeAnalytics(history), [history]);

  const hasData = history.length > 0;
  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return '#f59e0b';
      case 'A': return '#10b981';
      case 'B': return '#3b82f6';
      case 'C': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Analytics
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.125rem' }}>
            Track your performance, identify patterns, and improve over time.
          </p>
        </div>

        {!hasData && (
          <div
            className="card p-12 flex flex-col items-center justify-center gap-4 text-center"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }} role="img" aria-hidden="true">
              query_stats
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
              No Data Yet
            </h2>
            <p style={{ maxWidth: '320px', margin: 0 }}>
              Complete your first practice session to start seeing detailed analytics and performance trends.
            </p>
            <a href="/practice" className="btn-primary mt-2" style={{ fontWeight: 700, textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">play_arrow</span>
              Begin Practice
            </a>
          </div>
        )}

        {hasData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-5 flex flex-col gap-1">
                <span className="label-caps">Sessions</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.05em' }}>
                  {analytics.totalSessions}
                </span>
              </div>
              <div className="card p-5 flex flex-col gap-1">
                <span className="label-caps">Overall Accuracy</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.05em' }}>
                  {analytics.overallAccuracy}%
                </span>
              </div>
              <div className="card p-5 flex flex-col gap-1">
                <span className="label-caps">Best Grade</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: gradeColor(analytics.bestGrade), letterSpacing: '0.05em' }}>
                  {analytics.bestGrade}
                </span>
              </div>
              <div className="card p-5 flex flex-col gap-1">
                <span className="label-caps">Day Streak</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.05em' }}>
                  {analytics.currentStreak}
                </span>
              </div>
            </div>

            {/* Charts grid */}
            <div className="card p-6">
              <AccuracyTrendChart data={analytics.trend} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <LevelMasteryChart data={analytics.levelMastery} />
              </div>
              <div className="card p-6 flex flex-col gap-4">
                <OperationBreakdown data={analytics.operations} />
              </div>
            </div>

            <div className="card p-6">
              <ActivityHeatmap data={analytics.dailyActivity} />
            </div>

            {/* Additional stats */}
            <div className="card p-6">
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  margin: '0 0 1rem 0',
                }}
              >
                Lifetime Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="label-caps">Total Time</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    {analytics.totalTimeMinutes}m
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="label-caps">Best Streak</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    {analytics.bestStreak}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="label-caps">Levels Attempted</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    {analytics.levelMastery.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="label-caps">Day Streak</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    {analytics.currentStreak}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
