import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppStore, type HistoryEntry } from '../store/useAppStore';
import type { Grade } from '../utils/grading';

/* ─── Rank Tiers ─── */
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

/* ─── Compute Stats ─── */
function computeStats(history: HistoryEntry[]) {
  if (history.length === 0) {
    return {
      totalSessions: 0,
      totalCorrect: 0,
      totalAttempted: 0,
      avgAccuracy: 0,
      bestStreak: 0,
      totalPoints: 0,
      totalTimeMinutes: 0,
      bestGrade: 'D' as const,
      recentLevel: 1,
      todaySessions: 0,
      todayCorrect: 0,
      todayAttempted: 0,
      todayAccuracy: 0,
      last5: [] as HistoryEntry[],
    };
  }

  const totalSessions = history.length;
  const totalCorrect = history.reduce((s, h) => s + h.result.totalCorrect, 0);
  const totalAttempted = history.reduce((s, h) => s + h.result.totalAttempted, 0);
  const avgAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const bestStreak = Math.max(...history.map(h => h.result.bestStreak));
  const totalTimeMinutes = Math.round(history.reduce((s, h) => s + h.result.timeUsedSeconds, 0) / 60);

  // Points: 10 * correct answers + bonus for grade
  const gradeBonus = { S: 50, A: 30, B: 15, C: 5, D: 0 };
  const totalPoints = history.reduce((s, h) =>
    s + (h.result.totalCorrect * 10) + (gradeBonus[h.grade] || 0), 0
  );

  const gradeOrder = ['D', 'C', 'B', 'A', 'S'] as const;
  const bestGrade = gradeOrder[Math.max(...history.map(h => gradeOrder.indexOf(h.grade)))] || 'D';

  const recentLevel = history[history.length - 1].level;

  // Today's stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEntries = history.filter(h => h.timestamp >= todayStart.getTime());
  const todaySessions = todayEntries.length;
  const todayCorrect = todayEntries.reduce((s, h) => s + h.result.totalCorrect, 0);
  const todayAttempted = todayEntries.reduce((s, h) => s + h.result.totalAttempted, 0);
  const todayAccuracy = todayAttempted > 0 ? (todayCorrect / todayAttempted) * 100 : 0;

  const last5 = history.slice(-5).reverse();

  return {
    totalSessions, totalCorrect, totalAttempted, avgAccuracy,
    bestStreak, totalPoints, totalTimeMinutes, bestGrade,
    recentLevel, todaySessions, todayCorrect, todayAttempted,
    todayAccuracy, last5,
  };
}

const DAILY_GOAL = 5; // sessions per day

export default function Home() {
  const history = useAppStore(s => s.history);
  const level = useAppStore(s => s.practiceConfig.level);

  const stats = useMemo(() => computeStats(history), [history]);
  const rank = getRank(stats.totalPoints);
  const nextRank = getNextRank(stats.totalPoints);
  const goalProgress = Math.min(stats.todaySessions / DAILY_GOAL, 1);
  const goalPercent = Math.round(goalProgress * 100);

  const hasHistory = stats.totalSessions > 0;

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* ─── Hero Card ─── */}
        <div
          className="card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex flex-col gap-3 max-w-lg">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--color-on-surface)',
                lineHeight: 1.15,
              }}
            >
              {hasHistory
                ? `Welcome back! ${stats.todaySessions >= DAILY_GOAL ? '🎯 Goal reached!' : 'Keep the streak alive.'}`
                : 'Ready to master the beads?'}
            </h1>
            <p
              className="text-lg"
              style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}
            >
              {hasHistory
                ? `You've completed ${stats.totalSessions} session${stats.totalSessions !== 1 ? 's' : ''} with ${Math.round(stats.avgAccuracy)}% average accuracy.`
                : 'Start your first practice session and track your journey to Grandmaster.'}
            </p>
            <Link to="/practice" className="btn-primary mt-2 w-fit">
              {hasHistory ? 'Continue Practice' : 'Start Practice'}
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </Link>
          </div>

          {/* Daily Goal Ring */}
          <div className="flex-shrink-0 relative w-[120px] h-[120px]">
            <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--color-surface-container-high)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${goalProgress * 326.73} 326.73`}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  letterSpacing: '0.05em',
                }}
              >
                {goalPercent}%
              </span>
              <span className="label-caps" style={{ fontSize: '0.6rem' }}>
                {stats.todaySessions}/{DAILY_GOAL} today
              </span>
            </div>
          </div>
        </div>

        {/* ─── Middle Row: Stats + Level Badge ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Performance Stats Card */}
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
                    fontWeight: 700,
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

          {/* Level Badge */}
          <div
            className="card p-6 flex flex-col items-center justify-center gap-2 text-center"
            style={{
              backgroundColor: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '36px', color: 'var(--color-secondary-container)', fontVariationSettings: "'FILL' 1" }}
            >
              {rank.icon}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
              }}
            >
              Level {level}
            </span>
            <span className="text-sm opacity-80">{rank.name}</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                marginTop: '0.25rem',
              }}
            >
              {stats.totalPoints.toLocaleString()}
            </span>
            <span className="text-xs opacity-80">
              {nextRank
                ? `${nextRank.minPts - stats.totalPoints} pts to ${nextRank.name}`
                : 'Max Rank Achieved!'}
            </span>
          </div>
        </div>

        {/* ─── Recent History ─── */}
        {stats.last5.length > 0 && (
          <div className="card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '24px', color: 'var(--color-primary)' }}
              >
                history
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                Recent Sessions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {stats.last5.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: 'var(--color-surface-container)',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: gradeColor(entry.grade),
                        color: '#fff',
                      }}
                    >
                      {entry.grade}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-on-surface)' }}
                      >
                        Level {entry.level} — {entry.result.totalCorrect}/{entry.result.totalAttempted}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {formatTimeAgo(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-sm"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
                    >
                      {Math.round(entry.result.accuracyPercent)}%
                    </span>
                    <span
                      className="text-sm"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
                    >
                      {entry.result.timeUsedSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Bottom Row: Feature Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sheet Generator Card */}
          <Link
            to="/sheets"
            className="card card-interactive p-6 flex flex-col gap-3 no-underline"
            style={{ color: 'inherit' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-surface-container)' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '22px', color: 'var(--color-primary)' }}
                >
                  description
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                Sheet Generator
              </h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Create custom practice sheets tailored to your current level. Print or practice online.
            </p>
            <span
              className="mt-auto flex items-center gap-1 text-sm font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              Generate
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </span>
          </Link>

          {/* Level Guide Card */}
          <Link
            to="/levels"
            className="card card-interactive p-6 flex flex-col gap-3 no-underline"
            style={{ color: 'inherit' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-surface-container)' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '22px', color: 'var(--color-primary)' }}
                >
                  school
                </span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                Level Guide
              </h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Review the curriculum, see what's next, and track your overall mastery progress.
            </p>
            <span
              className="mt-auto flex items-center gap-1 text-sm font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              View Path
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function StatBlock({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--color-surface-container)' }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '20px', color: 'var(--color-primary)' }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--color-on-surface)',
        }}
      >
        {value}
      </span>
      <span className="label-caps" style={{ fontSize: '0.6rem' }}>{label}</span>
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
