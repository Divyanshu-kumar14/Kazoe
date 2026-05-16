import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export function TestInterface() {
  const session = useAppStore((s) => s.session);
  const config = useAppStore((s) => s.practiceConfig);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const endSession = useAppStore((s) => s.endSession);
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds);
  const [inputVal, setInputVal] = useState('');
  const [shake, setShake] = useState(false);
  const [answered, setAnswered] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount and after every submit
  useEffect(() => {
    inputRef.current?.focus();
  }, [session.currentIndex]);

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test in progress — leaving will reset your session';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      endSession();
      navigate('/practice/results', { replace: true });
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, endSession, navigate]);

  // If somehow finished from outside
  useEffect(() => {
    if (session.status === 'finished') {
      navigate('/practice/results', { replace: true });
    }
  }, [session.status, navigate]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputVal.trim();
    if (!trimmed || trimmed === '-') {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    submitAnswer(parseInt(trimmed, 10));
    setInputVal('');
    setAnswered((a) => a + 1);
  }, [inputVal, submitAnswer]);

  const handleSkip = useCallback(() => {
    submitAnswer('skipped');
    setInputVal('');
    setAnswered((a) => a + 1);
  }, [submitAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    },
    [handleSubmit, handleSkip]
  );

  const currentQ = session.questions[session.currentIndex];
  if (!currentQ) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft <= config.timeLimitSeconds * 0.2;
  const progress = Math.min(
    ((session.currentIndex) / Math.min(session.questions.length, 50)) * 100,
    100
  );

  const canSubmit = inputVal.trim().length > 0 && inputVal.trim() !== '-';

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
            Level {config.level}
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

        {/* Answered Count */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-on-surface-variant)',
          }}
        >
          {answered} done
        </span>
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
            # {session.currentIndex + 1}
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
            animation: shake ? 'headShake 0.4s ease-in-out' : 'none',
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
