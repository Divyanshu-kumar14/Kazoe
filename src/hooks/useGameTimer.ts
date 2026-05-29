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

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    hasFiredRef.current = false;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (timeLeft === 0 && !hasFiredRef.current && onTimeUpRef.current) {
      hasFiredRef.current = true;
      onTimeUpRef.current();
    }
  }, [timeLeft]);

  return { timeLeft, setTimeLeft };
}
