import { useState, useEffect, useRef, memo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

export default memo(function MultiplayerGame() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [countdownValue, dispatchCountdown] = useReducer(
    (state: number, action: 'tick' | 'reset') => {
      if (action === 'reset') return 3;
      if (action === 'tick') return Math.max(0, state - 1);
      return state;
    },
    3
  );


  const { match, playerNumber, currentQuestionIndex } = useMultiplayerStore();
  const {
    sendAnswer, matchStatus, scores, myAnswers, timeRemaining, forfeitTimer,
  } = useMultiplayerGame();

  const question = match?.questions[currentQuestionIndex];
  const myScore = playerNumber === 1 ? scores[0] : scores[1];
  const oppScore = playerNumber === 1 ? scores[1] : scores[0];
  const myAttempts = myAnswers.filter((a) => a !== null).length;
  const displaySeconds = Math.ceil(timeRemaining);
  const timerDisplay = `${Math.floor(displaySeconds / 60)}:${String(displaySeconds % 60).padStart(2, '0')}`;
  const totalDuration = match?.config?.timeLimitSeconds ?? 180;
  const timerPercent = totalDuration > 0 ? (timeRemaining / totalDuration) * 100 : 0;

  useEffect(() => {
    if (matchStatus === 'finished') {
      navigate('/multiplayer/results', { replace: true });
    }
  }, [matchStatus, navigate]);

  useEffect(() => {
    if (matchStatus === 'countdown') {
      dispatchCountdown('reset');
      
      const timer = setInterval(() => {
        dispatchCountdown('tick');
      }, 1000);
      
      countdownRef.current = timer;

      return () => {
        clearInterval(timer);
      };
    }
  }, [matchStatus]);

  useEffect(() => {
    if (countdownValue === 0 && countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  }, [countdownValue]);

  useEffect(() => {
    if (matchStatus === 'playing') {
      inputRef.current?.focus();
    }
  }, [matchStatus, currentQuestionIndex]);



  const handleSubmit = () => {
    if (!match || matchStatus !== 'playing' || inputValue === '') return;
    const answer = parseInt(inputValue, 10);
    if (isNaN(answer)) return;
    sendAnswer(answer);
    setInputValue('');
  };

  const handleSkip = () => {
    if (matchStatus !== 'playing') return;
    sendAnswer(null);
    setInputValue('');
  };

  if (matchStatus === 'idle') {
    navigate('/multiplayer', { replace: true });
    return null;
  }

  if (!match || !question) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p style={{ color: 'var(--color-on-surface-variant)' }}>Loading…</p>
      </div>
    );
  }

  const isHorizontal = question.operation === 'multiplication' || question.operation === 'division';

  return (
    <div className="flex-1 flex flex-col animate-fade-in" style={{ backgroundColor: 'var(--color-surface)' }}>
      {matchStatus === 'countdown' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="text-center">
            <div className="text-8xl font-bold animate-scale-in" style={{ color: 'var(--color-primary)' }}>
              {countdownValue > 0 ? countdownValue : 'Go!'}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
            {myAttempts} answered
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
                {myScore}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>You</span>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>vs</span>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
                {oppScore}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Opp</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
            <div
              className="h-full rounded-full transition-all duration-200 ease-linear"
              style={{
                width: `${timerPercent}%`,
                backgroundColor: timeRemaining > 30 ? 'var(--color-primary)' : 'var(--color-status-error)',
              }}
            />
          </div>
          <span
            className="font-mono text-sm font-bold tabular-nums shrink-0"
            style={{ color: timeRemaining > 30 ? 'var(--color-on-surface)' : 'var(--color-status-error)' }}
          >
            {timerDisplay}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[420px]">
          <div
            className="rounded-2xl p-5 sm:p-7 md:p-8"
            style={{
              background: 'var(--color-surface-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: 'var(--color-on-surface-variant)',
                  backgroundColor: 'var(--color-surface-container)',
                  padding: '0.1875rem 0.625rem',
                  borderRadius: '1rem',
                }}
              >
                # {currentQuestionIndex + 1}
              </span>
            </div>

            {isHorizontal ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                    fontWeight: 600,
                    color: 'var(--color-on-surface)',
                    letterSpacing: '0.04em',
                  }}>
                    {question.operands[0]?.toLocaleString()}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                  }}>
                    {question.operation === 'multiplication' ? '×' : '÷'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                    fontWeight: 600,
                    color: 'var(--color-on-surface)',
                    letterSpacing: '0.04em',
                  }}>
                    {question.operands[1]}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    color: 'var(--color-outline)',
                  }}>
                    =
                  </span>
                </div>

                {matchStatus === 'playing' && (
                  <div style={{ width: '100%', maxWidth: '200px' }}>
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.replace(/[^0-9-]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                        if (e.key === 'Escape') handleSkip();
                      }}
                      placeholder="?"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '2.25rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: inputValue ? 'var(--color-primary)' : 'var(--color-outline)',
                        backgroundColor: 'var(--color-surface-container-low)',
                        border: 'none',
                        borderBottom: `3px solid ${inputValue ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        borderRadius: '0.5rem 0.5rem 0 0',
                        textAlign: 'center',
                        padding: '0.5rem 0.75rem',
                        transition: 'border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                        caretColor: 'var(--color-primary)',
                        animation: flashKey > 0 ? 'flashSuccess 0.4s ease-out' : (shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none'),
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 0 0 2px var(--color-primary)';
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.25rem',
                  paddingRight: '0.25rem',
                }}>
                  {question.operands.map((op, i) => (
                    <div
                      key={`op-${i}-${op}`}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.75rem',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.125rem',
                        fontWeight: 500,
                        color: 'var(--color-outline)',
                        width: '1.25rem',
                        textAlign: 'right',
                      }}>
                        {i === 0 ? '' : op < 0 ? '−' : '+'}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '2.25rem',
                        fontWeight: 500,
                        color: 'var(--color-on-surface)',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                      }}>
                        {Math.abs(op)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  height: '2px',
                  backgroundColor: 'var(--color-on-surface)',
                  margin: '0.75rem 0',
                  borderRadius: '1px',
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--color-outline)',
                    width: '1.25rem',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    =
                  </span>
                  {matchStatus === 'playing' ? (
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.replace(/[^0-9-]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                        if (e.key === 'Escape') handleSkip();
                      }}
                      placeholder="?"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        minWidth: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '2.25rem',
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        color: inputValue ? 'var(--color-primary)' : 'var(--color-outline)',
                        backgroundColor: 'var(--color-surface-container-low)',
                        border: 'none',
                        borderBottom: `2px solid ${inputValue ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        borderRadius: '0.375rem 0.375rem 0 0',
                        textAlign: 'right',
                        padding: '0.375rem 0.625rem',
                        transition: 'border-color 0.2s ease, color 0.2s ease',
                        caretColor: 'var(--color-primary)',
                        animation: flashKey > 0 ? 'flashSuccess 0.4s ease-out' : (shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none'),
                      }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '2.25rem',
                      fontWeight: 500,
                      color: 'var(--color-outline)',
                      textAlign: 'right',
                      flex: 1,
                    }}>
                      ?
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {matchStatus === 'playing' && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                onClick={handleSkip}
                style={{
                  flex: '0 0 auto',
                  padding: '0.75rem 1.25rem',
                  color: 'var(--color-on-surface-variant)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: '0.625rem',
                  cursor: 'pointer',
                  background: 'var(--color-surface-container)',
                }}
              >
                Skip question
              </button>
              <button
                onClick={handleSubmit}
                disabled={inputValue === ''}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: inputValue !== '' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                  color: inputValue !== '' ? 'var(--color-on-primary)' : 'var(--color-outline)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '0.625rem',
                  cursor: inputValue !== '' ? 'pointer' : 'not-allowed',
                  opacity: inputValue !== '' ? 1 : 0.5,
                  boxShadow: inputValue !== '' ? '0 2px 8px rgba(0,89,92,0.2)' : 'none',
                }}
              >
                Submit answer
              </button>
            </div>
          )}

          <p style={{
            marginTop: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-outline)',
            textAlign: 'center',
          }}>
            <kbd style={{
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--color-surface-container)',
              border: '1px solid var(--color-outline-variant)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}>Enter</kbd> submit
            {' · '}
            <kbd style={{
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--color-surface-container)',
              border: '1px solid var(--color-outline-variant)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}>Esc</kbd> skip
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-container)' }}>
          <div className="text-center flex-1">
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
              You
            </div>
            <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
              {myScore}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              {myAttempts} attempts
            </div>
          </div>
          <div className="flex items-center px-4">
            <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>vs</span>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
              Opponent
            </div>
            <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-secondary)' }}>
              {oppScore}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              live
            </div>
          </div>
        </div>
      </div>

      {forfeitTimer !== null && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40" style={{ backgroundColor: 'var(--color-surface-container-highest)', borderTop: '1px solid var(--color-outline-variant)' }}>
          <p className="text-center text-sm font-medium" style={{ color: 'var(--color-status-error)' }}>
            Opponent disconnected, winning by forfeit in {forfeitTimer}s
          </p>
        </div>
      )}
    </div>
  );
});
