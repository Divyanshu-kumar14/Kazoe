import { useEffect, useState, useRef, memo } from 'react';
import { useSound } from '../../hooks/useSound';

interface CountdownProps {
  onDone: () => void;
}

export const Countdown = memo(function Countdown({ onDone }: CountdownProps) {
  const [count, setCount] = useState(3);
  const { playTick } = useSound();
  const onDoneRef = useRef(onDone);
  
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (count === 0) {
      onDoneRef.current();
      return;
    }
    playTick();
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, playTick]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface z-50">
      <span
        key={count}
        className="animate-scale-in font-display font-bold text-primary"
        style={{ fontSize: count === 0 ? '4rem' : '8rem' }}
      >
        {count === 0 ? 'Go!' : count}
      </span>
    </div>
  );
});
