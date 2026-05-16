import { useCallback, useRef } from 'react';

type OscType = 'sine' | 'square' | 'triangle' | 'sawtooth';

function beep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscType = 'sine',
  volume = 0.3
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playCorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      beep(ctx, 660, 0.12, 'sine', 0.25);
      setTimeout(() => beep(ctx, 880, 0.15, 'sine', 0.25), 100);
    } catch { /* user interaction may be needed */ }
  }, [getCtx]);

  const playWrong = useCallback(() => {
    try {
      const ctx = getCtx();
      beep(ctx, 200, 0.3, 'square', 0.2);
    } catch { /* silent */ }
  }, [getCtx]);

  const playComplete = useCallback(() => {
    try {
      const ctx = getCtx();
      beep(ctx, 523, 0.15, 'sine', 0.25);
      setTimeout(() => beep(ctx, 659, 0.15, 'sine', 0.25), 150);
      setTimeout(() => beep(ctx, 784, 0.2, 'sine', 0.25), 300);
    } catch { /* silent */ }
  }, [getCtx]);

  const playTick = useCallback(() => {
    try {
      const ctx = getCtx();
      beep(ctx, 1000, 0.05, 'triangle', 0.15);
    } catch { /* silent */ }
  }, [getCtx]);

  return { playCorrect, playWrong, playComplete, playTick };
}
