import { useEffect, useState, useCallback, useRef, memo } from 'react';
import type { ReactElement } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../../hooks/useSound';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useAdaptiveSession } from '../../hooks/useAdaptiveSession';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useDictation } from '../../hooks/useDictation';
import { completeDailyChallenge } from '../../utils/dailyChallenge';
import { PracticeModeSkeleton } from '../skeletons/PracticeModeSkeleton';
import { Countdown } from './Countdown';
import { PausedOverlay } from './PausedOverlay';

/* ─── Sub-components ─── */

interface TopBarProps {
  timeLeft: number;
  isWarning: boolean;
  level: number;
  currentIndex: number;
  onTogglePause: () => void;
  isAdaptive: boolean;
  adaptiveOffset: number;
  focusMode: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const TopBar = memo(function TopBar({ timeLeft, isWarning, level, currentIndex, onTogglePause, isAdaptive, adaptiveOffset, focusMode, isFullscreen, onToggleFullscreen }: TopBarProps): ReactElement {
  const fullscreenActive = focusMode && isFullscreen;

  return (
    <div style={topBarContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LevelBadge level={level} />
        {isAdaptive && (
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: adaptiveOffset > 0 ? 'var(--color-primary-container)' : adaptiveOffset < 0 ? 'var(--color-secondary-container)' : 'var(--color-surface-container)',
              color: adaptiveOffset > 0 ? 'var(--color-primary)' : adaptiveOffset < 0 ? 'var(--color-on-secondary-container)' : 'var(--color-on-surface-variant)',
            }}
          >
            {adaptiveOffset > 0 ? `+${adaptiveOffset}` : adaptiveOffset < 0 ? `${adaptiveOffset}` : 'base'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!fullscreenActive && (
          <>
            <TimerBadge timeLeft={timeLeft} isWarning={isWarning} />
            <span style={doneLabel}>{currentIndex} done</span>
          </>
        )}
        <button type="button" onClick={onTogglePause} aria-label="Pause session" style={pauseButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">pause</span>
        </button>
        <button type="button" onClick={onToggleFullscreen} aria-label={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'} style={fullscreenBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">
            {fullscreenActive ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </div>
    </div>
  );
});

function LevelBadge({ level }: { level: number }): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-outline)' }} role="img" aria-hidden="true">layers</span>
      <span style={badgeLabel}>Level {level}</span>
    </div>
  );
}

interface TimerBadgeProps {
  timeLeft: number;
  isWarning: boolean;
}

function TimerBadge({ timeLeft, isWarning }: TimerBadgeProps): ReactElement {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div style={{ ...timerBadgeBase, backgroundColor: isWarning ? 'var(--color-error-container)' : 'var(--color-surface-container)' }} aria-live="polite">
      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: isWarning ? 'var(--color-error)' : 'var(--color-outline)' }} role="img" aria-hidden="true">timer</span>
      <span style={{ ...timerBadgeText, color: isWarning ? 'var(--color-error)' : 'var(--color-on-surface)' }}>{mins}:{secs.toString().padStart(2, '0')}</span>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps): ReactElement {
  return (
    <div style={progressTrack}>
      <div style={{ ...progressFill, transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

interface ActionButtonsProps {
  canSubmit: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}

function ActionButtons({ canSubmit, onSubmit, onSkip }: ActionButtonsProps): ReactElement {
  return (
    <div style={actionRow}>
      <button type="button" onClick={onSkip} className="skip-btn focus-ring" style={skipButton}>Skip</button>
      <button type="button" onClick={onSubmit} disabled={!canSubmit} className="submit-btn focus-ring" style={{ ...submitButton, background: canSubmit ? 'var(--color-primary)' : 'var(--color-surface-container-high)', color: canSubmit ? 'var(--color-on-primary)' : 'var(--color-outline)', cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.5, boxShadow: canSubmit ? '0 2px 8px rgba(var(--color-primary-rgb), 0.2)' : 'none' }}>
        Submit Answer
      </button>
    </div>
  );
}

interface DictationInputProps {
  inputVal: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onReplay: () => void;
  speaking: boolean;
}

function DictationInput({ inputVal, inputRef, onInputChange, onKeyDown, onReplay, speaking }: DictationInputProps): ReactElement {
  return (
    <div className="animate-fade-in" style={dictationContainer}>
      <div style={dictationHint}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: speaking ? 'var(--color-primary)' : 'var(--color-outline)' }} role="img" aria-hidden="true">
          {speaking ? 'volume_up' : 'hearing'}
        </span>
        <span style={dictationHintText}>
          {speaking ? 'Listening...' : 'Question ready'}
        </span>
      </div>
      <div style={{ width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={inputVal}
          aria-label="Your Answer"
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your answer"
          autoComplete="off"
          style={{ ...answerInputBase, textAlign: 'center', flex: 1 }}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--color-primary)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button"
          onClick={onReplay}
          aria-label="Replay question"
          title="Replay question"
          style={replayButton}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }} role="img" aria-hidden="true">repeat</span>
        </button>
      </div>
    </div>
  );
}

function KeyboardHint(): ReactElement {
  const kbdStyle = {
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    backgroundColor: 'var(--color-surface-container)',
    border: '1px solid var(--color-outline-variant)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
  };

  return (
    <p style={hintText}>
      <kbd style={kbdStyle}>Enter</kbd> submit
      {' · '}
      <kbd style={kbdStyle}>Esc</kbd> skip
    </p>
  );
}

/* ─── Question display components ─── */

interface QuestionDisplayProps {
  currentIndex: number;
  shakeKey: number;
  flashKey: number;
  inputVal: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function MultDivQuestion({ currentIndex, shakeKey, flashKey, inputVal, inputRef, onInputChange, onKeyDown }: QuestionDisplayProps): ReactElement {
  const question = useAppStore((s) => s.session.questions[currentIndex]);
  if (!question) return <></>;

  const operator = question.operation === 'multiplication' ? '×' : '÷';

  return (
    <div className="animate-fade-in" style={multDivContainer}>
      <div style={multDivEquation}>
        <span style={operandText}>{question.operands[0]?.toLocaleString()}</span>
        <span style={operatorText}>{operator}</span>
        <span style={operandText}>{question.operands[1]}</span>
        <span style={operatorText}>=</span>
      </div>
      <div style={{ width: '100%', maxWidth: '200px', animation: shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none' }}>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={inputVal}
          aria-label="Your Answer"
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="?"
          autoComplete="off"
          style={{ ...answerInputBase, textAlign: 'center', animation: flashKey > 0 ? 'flashSuccess 0.4s ease-out' : (shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none') }}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--color-primary)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}

function AddSubQuestion({ currentIndex, shakeKey, flashKey, inputVal, inputRef, onInputChange, onKeyDown }: QuestionDisplayProps): ReactElement {
  const question = useAppStore((s) => s.session.questions[currentIndex]);
  if (!question) return <></>;

  return (
    <>
      <div style={addSubColumn}>
        {question.operands.map((op, idx) => {
          const rowKey = question.operands.slice(0, idx + 1).join('-');
          return (
            <div key={`op-${rowKey}`} className="animate-fade-in" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', animationDelay: `${idx * 50}ms` }}>
              <span style={addSubOperator}>{idx === 0 ? '' : op < 0 ? '−' : '+'}</span>
              <span style={addSubOperand}>{Math.abs(op)}</span>
            </div>
          );
        })}
      </div>
      <div style={addSubDivider} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', animation: shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none' }}>
        <span style={addSubEquals}>=</span>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={inputVal}
          aria-label="Your Answer"
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="?"
          autoComplete="off"
          style={{ ...answerInputBase, fontWeight: 500, textAlign: 'right', borderBottomWidth: '2px', borderRadius: '0.375rem 0.375rem 0 0', padding: '0.375rem 0.625rem', minWidth: 0, animation: flashKey > 0 ? 'flashSuccess 0.4s ease-out' : (shakeKey > 0 ? 'headShake 0.4s ease-in-out' : 'none') }}
          onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px var(--color-primary)'; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </>
  );
}

/* ─── Main component ─── */

export function TestInterface(): ReactElement | null {
  const sessionStatus = useAppStore((s) => s.session.status);
  const currentIndex = useAppStore((s) => s.session.currentIndex);
  const questions = useAppStore((s) => s.session.questions);
  const timeLimitSeconds = useAppStore((s) => s.practiceConfig.timeLimitSeconds);
  const level = useAppStore((s) => s.practiceConfig.level);
  const source = useAppStore((s) => s.practiceConfig.source);
  const focusMode = useAppStore((s) => s.practiceConfig.focusMode) ?? false;
  const dictation = useAppStore((s) => s.practiceConfig.dictation) ?? false;
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const endSession = useAppStore((s) => s.endSession);
  const navigate = useNavigate();

  // Adaptive difficulty hook
  const { getCurrentOffset, isAdaptive } = useAdaptiveSession();

  // Dictation hook
  const { speak, stop: stopDictation, speaking, usable: dictationUsable } = useDictation();

  const [phase, setPhase] = useState<'countdown' | 'playing' | 'paused'>('countdown');

  // Focus mode
  const { isFullscreen, supported, enter, exit, toggle: toggleFullscreen } = useFullscreen();

  // Auto-enter fullscreen when practice begins in focus mode
  useEffect(() => {
    if (phase === 'playing' && focusMode && supported && !isFullscreen) {
      enter();
    }
  }, [phase, focusMode, supported, isFullscreen, enter]);

  // Auto-exit fullscreen when session ends
  useEffect(() => {
    if (sessionStatus === 'finished' && isFullscreen) {
      exit();
    }
  }, [sessionStatus, isFullscreen, exit]);

  const handleTimeUp = useCallback(() => {
    endSession();
    // History entry now exists — mark daily challenge complete
    if (source === 'challenge') {
      const latestEntry = useAppStore.getState().history.filter(h => h.isDailyChallenge).sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latestEntry) {
        completeDailyChallenge(latestEntry.id);
      }
    }
    const dest = source === 'challenge' ? '/challenge/results' : '/practice/results';
    navigate(dest, { replace: true });
  }, [endSession, navigate, source]);
  const { timeLeft } = useGameTimer(timeLimitSeconds, phase, handleTimeUp);
  const [inputVal, setInputVal] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValRef = useRef('');
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenForRef = useRef<number | null>(null);
  const { playCorrect, playWrong } = useSound();

  useEffect(() => { inputRef.current?.focus(); }, [currentIndex]);

  // Dictation: speak the current question aloud when advancing to it
  // Must also wait for dictationUsable (voices loaded) before speaking
  useEffect(() => {
    if (!dictation || phase !== 'playing') return;

    // Don't re-speak the same question (e.g. when voices load after first attempt)
    if (currentIndex === spokenForRef.current) return;

    // Wait for voices/SpeechSynthesis to be ready
    if (!dictationUsable) return;

    const store = useAppStore.getState();
    const q = store.session.questions[store.session.currentIndex];
    if (q && q.operation === 'add_sub') {
      speak(q.operands);
      spokenForRef.current = currentIndex;
    }
  }, [currentIndex, dictation, phase, speak, dictationUsable]);

  // Stop speech when pausing; cancel on unmount
  useEffect(() => {
    if (dictation && phase !== 'playing') {
      stopDictation();
    }
    return () => { stopDictation(); };
  }, [dictation, phase, stopDictation]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Test in progress, leaving will reset your session';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'finished') {
      // If this is a daily challenge, mark it as completed
      if (source === 'challenge') {
        const latestEntry = useAppStore.getState().history
          .filter(h => h.isDailyChallenge)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (latestEntry) {
          completeDailyChallenge(latestEntry.id);
        }
      }
      const resultsDest = source === 'challenge' ? '/challenge/results' : '/practice/results';
      navigate(resultsDest, { replace: true });
    }
  }, [sessionStatus, navigate, source]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const triggerShake = useCallback(() => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setShakeKey((k) => k + 1);
    shakeTimerRef.current = setTimeout(() => setShakeKey(0), 400);
  }, []);

  const triggerFlash = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashKey((k) => k + 1);
    flashTimerRef.current = setTimeout(() => setFlashKey(0), 400);
  }, []);

  const handleInputChange = useCallback((val: string) => {
    setInputVal(val);
    inputValRef.current = val;
  }, []);

  const handleSubmit = useCallback(() => {
    const isDictating = !!useAppStore.getState().practiceConfig.dictation;
    const val = inputValRef.current;
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-') {
      if (!isDictating) { triggerShake(); playWrong(); }
      return;
    }
    const answer = Number(trimmed);

    if (!isDictating) {
      const currentQuestion = useAppStore.getState().session.questions[currentIndex];
      const isCorrect = currentQuestion && currentQuestion.answer === answer;
      if (isCorrect) { playCorrect(); triggerFlash(); }
      else { playWrong(); triggerShake(); }
    }

    submitAnswer(answer);
    setInputVal('');
    inputValRef.current = '';
  }, [submitAnswer, currentIndex, playCorrect, playWrong, triggerShake, triggerFlash]);

  const handleSkip = useCallback(() => {
    submitAnswer('skipped');
    setInputVal('');
    inputValRef.current = '';
    if (!useAppStore.getState().practiceConfig.dictation) playWrong();
  }, [submitAnswer, playWrong]);

  const handleReplay = useCallback(() => {
    const state = useAppStore.getState();
    const q = state.session.questions[state.session.currentIndex];
    if (q && q.operation === 'add_sub') {
      speak(q.operands);
    }
  }, [speak]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (phase === 'paused') return;
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
      else if (e.key === 'Escape') { e.preventDefault(); handleSkip(); }
    },
    [handleSubmit, handleSkip, phase]
  );

  const togglePause = useCallback(() => setPhase((p) => (p === 'playing' ? 'paused' : 'playing')), []);
  const startPlaying = useCallback(() => setPhase('playing'), []);

  if (phase === 'countdown') return <Countdown onDone={startPlaying} />;
  const dest = source === 'challenge' ? '/challenge' : '/practice';
  if (phase === 'paused') return <PausedOverlay onResume={togglePause} onQuit={() => { endSession(); navigate(dest); }} />;

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return <PracticeModeSkeleton />;
  }

  const isWarning = timeLeft <= timeLimitSeconds * 0.2;
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const canSubmit = inputVal.trim().length > 0 && inputVal.trim() !== '-';
  const isMultDiv = currentQuestion.operation === 'multiplication' || currentQuestion.operation === 'division';
  const isDictationActive = dictation && dictationUsable && !isMultDiv;
  const dictationUnavailable = dictation && !dictationUsable;

  return (
    <div className="animate-fade-in" style={pageContainer}>
      <TopBar timeLeft={timeLeft} isWarning={isWarning} level={level} currentIndex={currentIndex} onTogglePause={togglePause} isAdaptive={isAdaptive} adaptiveOffset={getCurrentOffset()} focusMode={focusMode} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
      {!(focusMode && isFullscreen) && <ProgressBar progress={progress} />}

      <div className="w-full max-w-[420px] rounded-2xl overflow-hidden p-5 sm:p-7 md:p-8" style={questionCard}>
        <div style={questionNumberBadge}>
          <span style={questionNumberBadgeText}># {currentIndex + 1}</span>
        </div>

        {isDictationActive ? (
          <DictationInput
            inputVal={inputVal}
            inputRef={inputRef}
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onReplay={handleReplay}
            speaking={speaking}
          />
        ) : (
          <>
            {dictationUnavailable && (
              <div style={dictationUnavailBanner}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }} role="img" aria-hidden="true">info</span>
                Dictation unavailable — no speech voices found in your browser
              </div>
            )}
            {isMultDiv ? (
              <MultDivQuestion currentIndex={currentIndex} shakeKey={shakeKey} flashKey={flashKey} inputVal={inputVal} inputRef={inputRef} onInputChange={handleInputChange} onKeyDown={handleKeyDown} />
            ) : (
              <AddSubQuestion currentIndex={currentIndex} shakeKey={shakeKey} flashKey={flashKey} inputVal={inputVal} inputRef={inputRef} onInputChange={handleInputChange} onKeyDown={handleKeyDown} />
            )}
          </>
        )}
      </div>

      <ActionButtons canSubmit={canSubmit} onSubmit={handleSubmit} onSkip={handleSkip} />
      {!(focusMode && isFullscreen) && <KeyboardHint />}
    </div>
  );
}

/* ─── Style constants ─── */

const pageContainer: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  padding: '1.5rem 1rem',
  backgroundColor: 'var(--color-surface)',
};

const topBarContainer: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  maxWidth: '380px',
  marginBottom: '0.5rem',
};

const badgeLabel: Record<string, string | number> = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-on-surface-variant)',
};

const timerBadgeBase: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '2rem',
  transition: 'background-color 0.3s ease',
};

const timerBadgeText: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.9375rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
};

const doneLabel: Record<string, string | number> = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-on-surface-variant)',
};

const pauseButton: Record<string, string | number> = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-outline)',
};

const fullscreenBtn: Record<string, string | number> = {
  background: 'none',
  border: 'none',
  padding: '4px',
  cursor: 'pointer',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-outline)',
};

const progressTrack: Record<string, string | number> = {
  height: '3px',
  borderRadius: '2px',
  backgroundColor: 'var(--color-surface-container-high)',
  marginBottom: '1.75rem',
  overflow: 'hidden',
};

const progressFill: Record<string, string | number> = {
  height: '100%',
  borderRadius: '2px',
  width: '100%',
  transformOrigin: 'left center',
  backgroundColor: 'var(--color-primary)',
  transition: 'transform 0.4s cubic-bezier(0.25,1,0.5,1)',
};

const questionCard: Record<string, string | number> = {
  background: 'var(--color-surface-lowest)',
  border: '1px solid var(--color-outline-variant)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)',
};

const questionNumberBadge: Record<string, string | number> = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '1.25rem',
};

const questionNumberBadgeText: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: 'var(--color-on-surface-variant)',
  backgroundColor: 'var(--color-surface-container)',
  padding: '0.1875rem 0.625rem',
  borderRadius: '1rem',
};

const multDivContainer: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
};

const multDivEquation: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const operandText: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'clamp(2rem, 5vw, 2.75rem)',
  fontWeight: 600,
  color: 'var(--color-on-surface)',
  letterSpacing: '0.04em',
};

const operatorText: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.5rem',
  fontWeight: 500,
  color: 'var(--color-primary)',
};

const answerInputBase: Record<string, string | number> = {
  width: '100%',
  fontFamily: 'var(--font-mono)',
  fontSize: '2.25rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-surface-container-low)',
  border: 'none',
  borderBottom: '3px solid var(--color-primary)',
  borderRadius: '0.5rem 0.5rem 0 0',
  outline: '2px solid transparent',
  padding: '0.5rem 0.75rem',
  transition: 'border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
  caretColor: 'var(--color-primary)',
};

const addSubColumn: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.25rem',
  paddingRight: '0.25rem',
};

const addSubOperator: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.125rem',
  fontWeight: 500,
  color: 'var(--color-outline)',
  width: '1.25rem',
  textAlign: 'right',
};

const addSubOperand: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '2.25rem',
  fontWeight: 500,
  color: 'var(--color-on-surface)',
  letterSpacing: '0.04em',
  lineHeight: 1.2,
};

const addSubDivider: Record<string, string | number> = {
  height: '2px',
  backgroundColor: 'var(--color-on-surface)',
  margin: '0.75rem 0',
  borderRadius: '1px',
};

const addSubEquals: Record<string, string | number> = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.125rem',
  fontWeight: 500,
  color: 'var(--color-outline)',
  width: '1.25rem',
  textAlign: 'right',
  flexShrink: 0,
};

const actionRow: Record<string, string | number> = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1.25rem',
  width: '100%',
  maxWidth: '380px',
};

const skipButton: Record<string, string | number> = {
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
};

const submitButton: Record<string, string | number> = {
  flex: 1,
  padding: '0.75rem 1.5rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '1rem',
  border: 'none',
  borderRadius: '0.625rem',
};

const hintText: Record<string, string | number> = {
  marginTop: '0.875rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--color-outline)',
  textAlign: 'center',
};

const dictationContainer: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
};

const dictationHint: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const dictationHintText: Record<string, string | number> = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-on-surface-variant)',
};

const dictationUnavailBanner: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 0.75rem',
  marginBottom: '1rem',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--color-on-surface-variant)',
  backgroundColor: 'var(--color-surface-container)',
};

const replayButton: Record<string, string | number> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '1px solid var(--color-outline-variant)',
  background: 'var(--color-surface-container)',
  cursor: 'pointer',
  color: 'var(--color-primary)',
  flexShrink: 0,
  transition: 'background 0.15s ease',
};
