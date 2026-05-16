import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeSessionResult } from '../../utils/grading';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';
import { useNavigate } from 'react-router-dom';

export function ResultScreen() {
  const startedAt = useAppStore((s) => s.session.startedAt);
  const finishedAt = useAppStore((s) => s.session.finishedAt);
  const answers = useAppStore((s) => s.session.answers);
  const questions = useAppStore((s) => s.session.questions);
  const level = useAppStore((s) => s.practiceConfig.level);
  const overrides = useAppStore((s) => s.practiceConfig.overrides);
  const navigate = useNavigate();

  const result = useMemo(() => {
    if (!startedAt || !finishedAt) return null;
    const levelConfig = {
      ...SOROBAN_LEVELS[level],
      ...overrides,
    };
    return computeSessionResult(
      answers,
      questions,
      levelConfig,
      startedAt,
      finishedAt
    );
  }, [startedAt, finishedAt, answers, questions, level, overrides]);

  if (!result) return <div>No result data.</div>;

  const stats = [
    { label: 'Score', value: `${result.totalCorrect} / ${result.totalAttempted}`, icon: 'check_circle' },
    { label: 'Accuracy', value: `${result.accuracyPercent}%`, icon: 'percent' },
    { label: 'Speed (QPM)', value: `${result.questionsPerMinute}`, icon: 'speed' },
    { label: 'Best Streak', value: `${result.bestStreak}`, icon: 'local_fire_department' },
  ];

  return (
    <div className="flex-1 p-4 flex flex-col items-center animate-fade-in-up">
      <div className="max-w-xl w-full mt-12 flex flex-col gap-8">
        
        {/* Grade Card */}
        <div className="card p-8 md:p-10 text-center flex flex-col gap-4">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Session Complete
          </h1>

          <div
            className="animate-scale-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '5rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              lineHeight: 1,
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {result.grade}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-on-surface-variant)',
              margin: 0,
            }}
          >
            Level {level}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`card p-5 flex flex-col gap-1 text-center animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: 'var(--color-primary)' }}
                >
                  {stat.icon}
                </span>
                <span className="label-caps">{stat.label}</span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  letterSpacing: '0.05em',
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/practice')}
            className="btn-secondary flex-1 justify-center py-3"
            style={{ fontWeight: 700 }}
          >
            Change Settings
          </button>
          <button
            onClick={() => {
              useAppStore.getState().startSession();
              navigate('/practice/session', { replace: true });
            }}
            className="btn-primary flex-1 justify-center py-3"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>replay</span>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
