import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loadDailyChallengeStatus, getTodayDate } from '../utils/dailyChallenge';
import { SOROBAN_LEVELS } from '../utils/levelConfig';

export default function DailyChallenge() {
  const navigate = useNavigate();
  const history = useAppStore((s) => s.history);
  const currentLevel = useAppStore((s) => s.practiceConfig.level);
  const setConfig = useAppStore((s) => s.setPracticeConfig);
  const questionType = useAppStore((s) => s.practiceConfig.questionType);

  const todayStatus = useMemo(() => loadDailyChallengeStatus(), []);
  const isToday = todayStatus.date === getTodayDate();

  // Check if the challenge session exists in history (latest entry)
  const challengeEntry = useMemo(() => {
    if (!isToday || !todayStatus.completed) return null;
    const challengeHistory = history.filter(h => h.isDailyChallenge).sort((a, b) => b.timestamp - a.timestamp);
    return challengeHistory[0] ?? null;
  }, [history, isToday, todayStatus.completed]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const handleStart = () => {
    useAppStore.getState().startChallengeSession();
    navigate('/challenge/session');
  };

  if (challengeEntry) {
    const { result, grade } = challengeEntry;
    return (
      <div className="flex-1 animate-fade-in-up">
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
          {/* Completed Card */}
          <div className="card p-8 md:p-10 text-center flex flex-col gap-5">
            <div
              className="size-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--color-primary-container)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '36px', color: 'var(--color-on-primary-container)', fontVariationSettings: "'FILL' 1" }}
                role="img" aria-hidden="true"
              >
                stars
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 600,
                color: 'var(--color-on-surface)',
                margin: 0,
              }}
            >
              Today's Challenge Complete!
            </h1>

            <div
              className="animate-scale-in"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '4.5rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                lineHeight: 1,
                margin: '0.25rem 0',
              }}
            >
              {grade}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="card p-4 flex flex-col gap-1">
                <span className="label-caps text-center">Accuracy</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {Math.round(result.accuracyPercent)}%
                </span>
              </div>
              <div className="card p-4 flex flex-col gap-1">
                <span className="label-caps text-center">Correct</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {result.totalCorrect}/{result.totalAttempted}
                </span>
              </div>
              <div className="card p-4 flex flex-col gap-1">
                <span className="label-caps text-center">Time</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {formatTime(result.timeUsedSeconds)}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--color-on-surface-variant)', margin: 0, fontSize: '0.9375rem' }}>
              Come back tomorrow for a new challenge!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button type="button"
                onClick={() => navigate('/')}
                className="btn-primary flex-1 justify-center py-3"
                style={{ fontWeight: 700 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">home</span>
                View Dashboard
              </button>
              <button type="button"
                onClick={() => navigate('/practice')}
                className="btn-secondary flex-1 justify-center py-3"
                style={{ fontWeight: 700 }}
              >
                Practice More
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not yet completed — show the challenge card
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        {/* Challenge Card */}
        <div className="card p-8 md:p-10 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="size-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-container)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '28px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
                role="img" aria-hidden="true"
              >
                emoji_events
              </span>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                Daily Challenge
              </h1>
              <p style={{ color: 'var(--color-on-surface-variant)', margin: '0.125rem 0 0 0', fontSize: '0.9375rem' }}>
                {dateStr}
              </p>
            </div>
          </div>

          <p style={{ color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.6 }}>
            Same questions for everyone, every day. Complete today's challenge and see how you stack up.
          </p>

          {/* Config */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="label-caps whitespace-nowrap">Level</span>
              <select
                className="input-field"
                aria-label="Challenge level"
                value={currentLevel}
                onChange={(e) => setConfig({ level: Number(e.target.value) })}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl} , {questionType === 'add_sub'
                      ? SOROBAN_LEVELS[lvl]!.operations.replace(/_/g, ' ')
                      : questionType === 'multiplication' ? 'multiplication' : 'division'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="label-caps whitespace-nowrap">Type</span>
              <select
                className="input-field"
                aria-label="Question type"
                value={questionType}
                onChange={(e) => setConfig({ questionType: e.target.value as 'add_sub' | 'multiplication' | 'division' })}
              >
                <option value="add_sub">Addition / Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
              </select>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-3">
            <span
              className="px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }} role="img" aria-hidden="true">timer</span>
              2 minutes
            </span>
            <span
              className="px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }} role="img" aria-hidden="true">public</span>
              Same seed worldwide
            </span>
            <span
              className="px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }} role="img" aria-hidden="true">emoji_events</span>
              Daily leaderboard
            </span>
          </div>

          <button type="button"
            onClick={handleStart}
            className="btn-primary btn-primary-lg w-full py-3.5 text-base"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }} role="img" aria-hidden="true">play_arrow</span>
            Start Today's Challenge
          </button>
        </div>

        {/* Rules card */}
        <div className="card p-6 flex flex-col gap-3">
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Challenge Rules
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.8 }}>
            <li>Same seed for everyone worldwide, fair for all</li>
            <li>Complete within 2 minutes</li>
            <li>Results are recorded with a special marker</li>
            <li>A new challenge drops every day at midnight</li>
            <li>Track your daily streak on the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
