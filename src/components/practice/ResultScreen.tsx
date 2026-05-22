import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeSessionResult } from '../../utils/grading';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

function randomPieces() {
  const pieces: Array<{ id: number; left: string; color: string; delay: string; duration: string; size: string; rotation: string }> = [];
  for (let i = 0; i < 40; i++) {
    pieces.push({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: `${Math.random() * 1.5}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: `${6 + Math.random() * 8}px`,
      rotation: `${Math.random() * 360}deg`,
    });
  }
  return pieces;
}

function ConfettiOverlay() {
  const [pieces] = useState(randomPieces);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            position: 'absolute',
            top: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animation: `confetti-fall ${p.duration} ease-out ${p.delay} both`,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}

type ReviewItem = {
  index: number;
  operands: number[];
  userAnswer: number | 'skipped' | null;
  correctAnswer: number;
  status: 'correct' | 'wrong' | 'skipped' | 'unanswered';
  operation: 'add_sub' | 'multiplication' | 'division';
};

export function ResultScreen() {
  const startedAt = useAppStore((s) => s.session.startedAt);
  const finishedAt = useAppStore((s) => s.session.finishedAt);
  const answers = useAppStore((s) => s.session.answers);
  const questions = useAppStore((s) => s.session.questions);
  const level = useAppStore((s) => s.practiceConfig.level);
  const overrides = useAppStore((s) => s.practiceConfig.overrides);
  const navigate = useNavigate();
  const { playComplete } = useSound();
  const [showReview, setShowReview] = useState(false);

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

  const reviewItems: ReviewItem[] = useMemo(() => {
    return questions.map((q, i) => {
      const userAnswer = answers[i] ?? null;
      let status: ReviewItem['status'];
      if (userAnswer === 'skipped') status = 'skipped';
      else if (userAnswer === null) status = 'unanswered';
      else if (userAnswer === q.answer) status = 'correct';
      else status = 'wrong';
      return { index: i, operands: q.operands, userAnswer, correctAnswer: q.answer, status, operation: q.operation };
    });
  }, [questions, answers]);

  useEffect(() => {
    playComplete();
  }, [playComplete]);

  if (!result) return <div>No result data.</div>;

  const showConfetti = result.grade === 'S' || result.grade === 'A';

  const stats = [
    { label: 'Score', value: `${result.totalCorrect} / ${result.totalAttempted}`, icon: 'check_circle' },
    { label: 'Accuracy', value: `${result.accuracyPercent}%`, icon: 'percent' },
    { label: 'Speed (QPM)', value: `${result.questionsPerMinute}`, icon: 'speed' },
    { label: 'Best Streak', value: `${result.bestStreak}`, icon: 'local_fire_department' },
  ];

  return (
    <div className="flex-1 p-4 flex flex-col items-center animate-fade-in-up">
      {showConfetti && <ConfettiOverlay />}
      <div className="max-w-xl w-full mt-12 flex flex-col gap-8">

        {/* Grade Card */}
        <div className="card p-8 md:p-10 text-center flex flex-col gap-4">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 600,
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

        {/* Question Review Toggle */}
        <div className="card p-6 flex flex-col gap-4">
          <button type="button"
            onClick={() => setShowReview((v) => !v)}
            className="btn-secondary w-full justify-center"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {showReview ? 'expand_less' : 'expand_more'}
            </span>
            {showReview ? 'Hide' : 'Review'} Answers
          </button>

          {showReview && (
            <div className="flex flex-col gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {reviewItems.map((item) => {
                const bgColor = item.status === 'correct'
                  ? 'var(--color-primary-container)' as const
                  : item.status === 'wrong'
                    ? 'var(--color-error-container)' as const
                    : item.status === 'skipped'
                      ? 'var(--color-secondary-container)' as const
                      : 'transparent';
                const textColor = item.status === 'skipped'
                  ? 'var(--color-on-secondary-container)' as const
                  : undefined;
                return (
                  <div
                    key={item.index}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <span
                        className="size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor:
                            item.status === 'correct' ? 'var(--color-primary)' :
                            item.status === 'wrong' ? 'var(--color-error)' :
                            'var(--color-secondary)',
                          color: 'var(--color-on-primary)',
                        }}
                      >
                        {item.status === 'correct' ? '✓' : item.status === 'wrong' ? '✗' : '—'}
                      </span>
                      <span
                        className="text-sm font-semibold truncate"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-on-surface)',
                        }}
                      >
                        {item.operands.map((op, i) =>
                          `${i === 0 ? '' : (item.operation === 'multiplication' ? '×' : item.operation === 'division' ? '÷' : op < 0 ? '−' : '+')}${Math.abs(op)}`
                        ).join(' ')}
                        {' = '}
                        <span style={{ fontWeight: 700 }}>{item.correctAnswer}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.userAnswer !== null && item.userAnswer !== 'skipped' && (
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: item.status === 'correct' ? 'var(--color-primary)' : 'var(--color-error)',
                            fontWeight: item.status === 'wrong' ? 700 : 500,
                          }}
                        >
                          {item.status === 'wrong' ? `Your: ${item.userAnswer}` : item.userAnswer}
                        </span>
                      )}
                      {item.status === 'skipped' && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-on-secondary-container)' }}>
                          Skipped
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button"
            onClick={() => navigate('/practice')}
            className="btn-secondary flex-1 justify-center py-3"
            style={{ fontWeight: 700 }}
          >
            Change Settings
          </button>
          <button type="button"
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
