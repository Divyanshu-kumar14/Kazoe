import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';

interface CountdownProps {
  onDone: () => void;
}

function Countdown({ onDone }: CountdownProps) {
  const [count, setCount] = useState(3);
  const { playTick } = useSound();

  useEffect(() => {
    if (count === 0) {
      onDone();
      return;
    }
    playTick();
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone, playTick]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
        zIndex: 100,
      }}
    >
      <span
        key={count}
        className="animate-scale-in"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: count === 0 ? '4rem' : '8rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
        }}
      >
        {count === 0 ? 'Go!' : count}
      </span>
    </div>
  );
}

export function TestInterface() {
  const sessionStatus = useAppStore((s) => s.session.status);
  const currentIndex = useAppStore((s) => s.session.currentIndex);
  const questions = useAppStore((s) => s.session.questions);
  const timeLimitSeconds = useAppStore((s) => s.practiceConfig.timeLimitSeconds);
  const level = useAppStore((s) => s.practiceConfig.level);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const endSession = useAppStore((s) => s.endSession);
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'countdown' | 'playing' | 'paused'>('countdown');
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [inputVal, setInputVal] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playCorrect, playWrong } = useSound();

  // Auto-focus the input on mount and after every submit
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test in progress — leaving will reset your session';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Timer interval — only decrements, no side effects
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Watch for timeLeft reaching 0 or session being finished
  useEffect(() => {
    if (sessionStatus === 'finished') {
      navigate('/practice/results', { replace: true });
      return;
    }
    if (phase === 'playing' && timeLeft <= 0) {
      endSession();
    }
  }, [timeLeft, phase, sessionStatus, endSession, navigate]);

  const triggerShake = useCallback(() => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeKey((k) => k + 1);
    shakeTimerRef.current = setTimeout(() => setShakeKey(0), 400);
  }, []);

  // Cleanup shake timer on unmount
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = inputVal.trim();
    if (!trimmed || trimmed === '-') {
      triggerShake();
      playWrong();
      return;
    }
    const answer = Number(trimmed);
    const currentQ = questions[currentIndex];
    const isCorrect = currentQ && currentQ.answer === answer;

    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
      triggerShake();
    }

    submitAnswer(answer);
    setInputVal('');
  }, [inputVal, submitAnswer, currentIndex, questions, playCorrect, playWrong, triggerShake]);

  const handleSkip = useCallback(() => {
    submitAnswer('skipped');
    setInputVal('');
    playWrong();
  }, [submitAnswer, playWrong]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (phase === 'paused') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    },
    [handleSubmit, handleSkip, phase]
  );

  const togglePause = useCallback(() => {
    setPhase((p) => (p === 'playing' ? 'paused' : 'playing'));
  }, []);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft <= timeLimitSeconds * 0.2;
  const progress = questions.length > 0
    ? (currentIndex / questions.length) * 100
    : 0;

  const canSubmit = inputVal.trim().length > 0 && inputVal.trim() !== '-';

  if (phase === 'countdown') {
    return <Countdown onDone={() => setPhase('playing')} />;
  }

  if (phase === 'paused') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          padding: '1.5rem 1rem',
          backgroundColor: 'var(--color-surface)',
          gap: '2rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          PAUSED
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={togglePause}
            className="btn-primary"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              play_arrow
            </span>
            Resume
          </button>
          <button
            onClick={() => {
              endSession();
              navigate('/practice');
            }}
            className="btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              exit_to_app
            </span>
            Quit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: '1.5rem 1rem',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* ── Compact Status Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '380px',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '15px', color: 'var(--color-outline)' }}
          >
            layers
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant)',
            }}
          >
            Level {level}
          </span>
        </div>

        {/* Timer Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '2rem',
            backgroundColor: isWarning
              ? 'var(--color-error-container)'
              : 'var(--color-surface-container)',
            transition: 'background-color 0.3s ease',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '14px',
              color: isWarning ? 'var(--color-error)' : 'var(--color-outline)',
            }}
          >
            timer
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: isWarning ? 'var(--color-error)' : 'var(--color-on-surface)',
            }}
          >
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Answered Count + Pause */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant)',
            }}
          >
            {currentIndex} done
          </span>
          <button
            onClick={togglePause}
            title="Pause session"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-outline)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              pause
            </span>
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          height: '3px',
          borderRadius: '2px',
          backgroundColor: 'var(--color-surface-container-high)',
          marginBottom: '1.75rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            width: `${progress}%`,
            backgroundColor: 'var(--color-primary)',
            transition: 'width 0.4s cubic-bezier(0.25,1,0.5,1)',
          }}
        />
      </div>

      {/* ── Question Card (Hero) ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--color-surface-lowest)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: '1rem',
          padding: '1.75rem 2rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {/* Question Counter Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--color-on-surface-variant)',
              backgroundColor: 'var(--color-surface-container)',
              padding: '0.1875rem 0.625rem',
              borderRadius: '1rem',
            }}
          >
            # {currentIndex + 1}
          </span>
        </div>

        {/* Operands */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem',
            paddingRight: '0.25rem',
          }}
        >
          {currentQ.operands.map((op, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                animationDelay: `${i * 50}ms`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  color: 'var(--color-outline)',
                  width: '1.25rem',
                  textAlign: 'right',
                }}
              >
                {i === 0 ? '' : op < 0 ? '−' : '+'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.25rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.2,
                }}
              >
                {Math.abs(op)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: '2px',
            backgroundColor: 'var(--color-on-surface)',
            margin: '0.75rem 0',
            borderRadius: '1px',
          }}
        />

        {/* Answer Input Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.125rem',
              fontWeight: 500,
              color: 'var(--color-outline)',
              width: '1.25rem',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            =
          </span>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="?"
            autoComplete="off"
            style={{
              width: '100%',
              minWidth: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '2.25rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: inputVal ? 'var(--color-primary)' : 'var(--color-outline)',
              backgroundColor: 'var(--color-surface-container-low)',
              border: 'none',
              borderBottom: `2px solid ${inputVal ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
              borderRadius: '0.375rem 0.375rem 0 0',
              outline: 'none',
              textAlign: 'right',
              padding: '0.375rem 0.625rem',
              transition: 'border-color 0.2s ease, color 0.2s ease',
              caretColor: 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '1.25rem',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        <button
          onClick={handleSkip}
          style={{
            flex: '0 0 auto',
            padding: '0.75rem 1.25rem',
            background: 'var(--color-surface-container)',
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '0.625rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-container-high)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
          }}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: canSubmit ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
            color: canSubmit ? 'var(--color-on-primary)' : 'var(--color-outline)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '1rem',
            border: 'none',
            borderRadius: '0.625rem',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
            boxShadow: canSubmit ? '0 2px 8px rgba(0,89,92,0.2)' : 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (canSubmit) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,89,92,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = canSubmit ? '0 2px 8px rgba(0,89,92,0.2)' : 'none';
          }}
        >
          Submit
        </button>
      </div>

      {/* Keyboard hint */}
      <p
        style={{
          marginTop: '0.875rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: 'var(--color-outline)',
          textAlign: 'center',
        }}
      >
        <kbd style={{
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          backgroundColor: 'var(--color-surface-container)',
          border: '1px solid var(--color-outline-variant)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
        }}>Enter</kbd> submit
        {' · '}
        <kbd style={{
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          backgroundColor: 'var(--color-surface-container)',
          border: '1px solid var(--color-outline-variant)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
        }}>Esc</kbd> skip
      </p>
    </div>
  );
}
