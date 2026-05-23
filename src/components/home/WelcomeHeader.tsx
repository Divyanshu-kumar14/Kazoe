import { Link } from 'react-router-dom';

interface WelcomeHeaderProps {
  hasHistory: boolean;
  todaySessions: number;
  avgAccuracy: number;
  totalSessions: number;
  goalProgress: number;
  goalPercent: number;
  DAILY_GOAL: number;
}

export function WelcomeHeader({
  hasHistory,
  todaySessions,
  avgAccuracy,
  totalSessions,
  goalProgress,
  goalPercent,
  DAILY_GOAL,
}: WelcomeHeaderProps) {
  return (
    <div
      className="card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
    >
      <div className="flex flex-col items-center md:items-start gap-3 max-w-lg">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            lineHeight: 1.15,
          }}
        >
          {hasHistory
            ? `Welcome back! ${todaySessions >= DAILY_GOAL ? '🎯 Goal reached!' : 'Keep the streak alive.'}`
            : 'Ready to master the beads?'}
        </h1>
        <p
          className="text-lg"
          style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}
        >
          {hasHistory
            ? `You've completed ${totalSessions} session${totalSessions !== 1 ? 's' : ''} with ${Math.round(avgAccuracy)}% average accuracy.`
            : 'Start your first practice session and track your journey to Grandmaster.'}
        </p>
        <Link to="/practice" className="btn-primary mt-2 w-fit">
          {hasHistory ? 'Continue Practice' : 'Start Practice'}
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>

      {/* Daily Goal Ring */}
      <div className="flex-shrink-0 relative size-[120px]">
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
          <span className="label-caps" style={{ fontSize: '0.75rem' }}>
            {todaySessions}/{DAILY_GOAL} today
          </span>
        </div>
      </div>
    </div>
  );
}
