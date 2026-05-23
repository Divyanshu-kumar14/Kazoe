import { useState, useEffect, useRef } from 'react';

export function useGameTimer(
  timeLimitSeconds: number,
  phase: 'countdown' | 'playing' | 'paused',
  onTimeUp?: () => void
) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
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
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev > 0 && onTimeUp) {
          onTimeUp();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, onTimeUp]);

  return { timeLeft, setTimeLeft };
}
