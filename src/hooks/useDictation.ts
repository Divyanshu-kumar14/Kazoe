import { useCallback, useEffect, useRef, useState } from 'react';
import { synthesizeSpeech, hasNvidiaApiKey } from '../lib/nvidia-tts';
import { playPcmAudio, stopAudio } from '../lib/audio-player';

// ─── Browser TTS constants ───

/** Gap between speech segments in ms */
const SEGMENT_GAP_MS = 350;

/** Gap before the final "equals" cue */
const END_GAP_MS = 700;

/**
 * Safety timeout per segment: if onend doesn't fire within this window,
 * force-advance to prevent the "Listening..." stuck state.
 */
const SEGMENT_TIMEOUT_MS = 5000;

// ─── Utils ───

/**
 * Build spoken segments from add/sub operands.
 * For operands [22, 45, -60] → ["22", "plus", "45", "minus", "60", "equals"]
 */
function buildOperandSegments(operands: number[]): string[] {
  const segments: string[] = [];
  for (let i = 0; i < operands.length; i++) {
    const val = operands[i];
    if (val === undefined) continue;
    if (i > 0) {
      segments.push(val >= 0 ? 'plus' : 'minus');
    }
    segments.push(Math.abs(val).toString());
  }
  segments.push('equals');
  return segments;
}

/**
 * Build a single natural sentence for the NVIDIA TTS engine.
 * For operands [22, 45, -60] → "22 plus 45 minus 60 equals"
 */
function buildSentence(operands: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < operands.length; i++) {
    const val = operands[i];
    if (val === undefined) continue;
    if (i > 0) {
      parts.push(val >= 0 ? 'plus' : 'minus');
    }
    parts.push(Math.abs(val).toString());
  }
  parts.push('equals');
  return parts.join(' ');
}

/**
 * Returns true if the browser has both the speechSynthesis API
 * and at least one installed voice.
 */
function checkVoicesReady(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.getVoices().length > 0;
}

// ─── Hook ───

export function useDictation() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return hasNvidiaApiKey() || 'speechSynthesis' in window;
  });
  const [voicesReady, setVoicesReady] = useState(checkVoicesReady);

  const nvidiaEnabled = hasNvidiaApiKey();

  // Listen for async voice loading (Chrome loads voices lazily)
  // Only needed when falling back to browser SpeechSynthesis
  useEffect(() => {
    if (nvidiaEnabled || !supported) return;

    const onChange = () => setVoicesReady(checkVoicesReady());

    // Standard event listener
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = onChange;
    }
    window.speechSynthesis.addEventListener?.('voiceschanged', onChange);

    // Initial check in case they loaded between mount and effect
    onChange();

    // Fallback polling: Chrome on Linux sometimes NEVER fires voiceschanged
    // until it arbitrarily decides the voices are loaded, and polling
    // getVoices() helps force it.
    const pollInterval = setInterval(() => {
      if (checkVoicesReady()) {
        setVoicesReady(true);
        clearInterval(pollInterval);
      }
    }, 500);

    return () => {
      if (window.speechSynthesis.onvoiceschanged === onChange) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      window.speechSynthesis.removeEventListener?.('voiceschanged', onChange);
      clearInterval(pollInterval);
    };
  }, [nvidiaEnabled, supported]);

  /** True when dictation can actually produce sound */
  const usable = supported && (nvidiaEnabled || voicesReady);

  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    clearTimers();

    // Cancel in-flight NVIDIA API request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Stop browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop PCM audio playback
    stopAudio();

    setSpeaking(false);
  }, [clearTimers]);

  /**
   * Speak operands via browser SpeechSynthesis (segment by segment).
   * Caller must ensure window.speechSynthesis is available.
   */
  const speakViaSS = useCallback((operands: number[]) => {
    window.speechSynthesis.resume();

    const segments = buildOperandSegments(operands);
    if (segments.length === 0) return;

    let index = 0;

    const speakNext = () => {
      if (cancelledRef.current || !mountedRef.current) {
        setSpeaking(false);
        return;
      }

      if (index >= segments.length) {
        setSpeaking(false);
        return;
      }

      const text = segments[index]!;
      const isLast = index === segments.length - 1;
      const gap = isLast ? END_GAP_MS : SEGMENT_GAP_MS;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;

      // Pick the first English voice for consistent sound
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
      if (enVoice) utterance.voice = enVoice;

      let settled = false;

      const settle = (advance: boolean) => {
        if (settled || cancelledRef.current || !mountedRef.current) return;
        settled = true;
        if (safetyRef.current) clearTimeout(safetyRef.current);
        if (advance) {
          index++;
          timeoutRef.current = setTimeout(speakNext, gap);
        } else {
          setSpeaking(false);
        }
      };

      utterance.onend = () => settle(true);
      utterance.onerror = () => settle(true);

      // Safety net: if onend never fires, force-advance
      safetyRef.current = setTimeout(
        () => settle(true),
        SEGMENT_TIMEOUT_MS,
      );

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        settle(true);
      }
    };

    setSpeaking(true);
    timeoutRef.current = setTimeout(speakNext, 200);
  }, []);

  const speak = useCallback(
    (operands: number[]) => {
      if (!supported) return;

      stop();
      cancelledRef.current = false;

      if (nvidiaEnabled) {
        // ── NVIDIA TTS engine (with SpeechSynthesis fallback) ──
        const sentence = buildSentence(operands);
        if (!sentence.trim()) return;

        setSpeaking(true);

        const controller = new AbortController();
        abortRef.current = controller;
        let fellBack = false;

        synthesizeSpeech(sentence, {}, controller.signal)
          .then((audioData) => {
            if (cancelledRef.current || !mountedRef.current) return;
            return playPcmAudio(audioData, 24000);
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            // NVIDIA API failed — fall back to browser SpeechSynthesis
            console.warn('NVIDIA TTS failed, falling back to SpeechSynthesis');
            fellBack = true;
            speakViaSS(operands);
          })
          .finally(() => {
            // Only set speaking=false here if we DIDN'T fall back to
            // SpeechSynthesis (which manages its own speaking state).
            if (mountedRef.current && !cancelledRef.current && !fellBack) {
              setSpeaking(false);
            }
          });
      } else if (voicesReady) {
        // ── Browser SpeechSynthesis engine ──
        speakViaSS(operands);
      }
      // If voices aren't ready yet, silently skip until they load
    },
    [stop, supported, nvidiaEnabled, voicesReady, speakViaSS],
  );

  return { speak, stop, speaking, supported, usable };
}
