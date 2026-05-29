import { useState, useEffect, useRef } from 'react';

export function useGameTimer(
  timeLimitSeconds: number,
  phase: 'countdown' | 'playing' | 'paused',
  onTimeUp?: () => void
) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const hasFiredRef = useRef(false);
  // Track the wall-clock start time so elapsed time is computed from
  // real time rather than accumulated interval ticks.  This avoids
  // drift caused by browser throttling (background tabs, GC pauses).
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef(timeLimitSeconds);
  // Track accumulated time from previous playing segments (pause/resume)
  const accumulatedRef = useRef(0);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // When timeLimitSeconds changes (new session), reset duration and accumulated time.
  useEffect(() => {
    durationRef.current = timeLimitSeconds;
    hasFiredRef.current = false;
    accumulatedRef.current = 0;
    // We intentionally do NOT call setTimeLeft here to avoid the
    // "setState in effect" lint rule.  The playing-phase effect below
    // will pick up the new durationRef and set timeLeft on start.
  }, [timeLimitSeconds]);

  useEffect(() => {
    if (phase !== 'playing') {
      // When pausing, accumulate the elapsed time from this segment
      if (timerRef.current) {
        if (startTimeRef.current > 0) {
          accumulatedRef.current += (performance.now() - startTimeRef.current) / 1000;
        }
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Starting/resuming: record wall-clock start
    hasFiredRef.current = false;
    startTimeRef.current = performance.now();

    // Immediately compute the initial timeLeft so the UI is correct
    // before the first interval tick.
    const initialRemaining = Math.max(0, durationRef.current - accumulatedRef.current);
    setTimeLeft(Math.ceil(initialRemaining));

    timerRef.current = setInterval(() => {
      const elapsedThisSegment = (performance.now() - startTimeRef.current) / 1000;
      const totalElapsed = accumulatedRef.current + elapsedThisSegment;
      const remaining = Math.max(0, durationRef.current - totalElapsed);
      const rounded = Math.ceil(remaining);

      setTimeLeft(rounded);

      // Fire onTimeUp inside the interval callback to guarantee it fires
      // exactly once, even if React batches/skips intermediate renders.
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (!hasFiredRef.current) {
          hasFiredRef.current = true;
          if (onTimeUpRef.current) {
            onTimeUpRef.current();
          }
        }
      }
    }, 250); // 250ms for smoother countdown and reliable zero-crossing

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  return { timeLeft, setTimeLeft };
}
