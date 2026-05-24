import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { createAdaptiveState, recordAnswer, getAdaptiveConfig, type AdaptiveState } from '../utils/adaptiveDifficulty';
import { generateQuestion } from '../utils/questionGenerator';

/**
 * Hook that manages adaptive difficulty during a session.
 * Tracks performance and generates questions at the right difficulty level.
 */
export function useAdaptiveSession() {
  const adaptiveStateRef = useRef<AdaptiveState>(createAdaptiveState());
  const questionStartTimeRef = useRef<number>(0);
  const lastCorrectRef = useRef<boolean | null>(null);

  const isAdaptive = useAppStore((s) => s.practiceConfig.adaptiveDifficulty) ?? false;
  const baseLevel = useAppStore((s) => s.practiceConfig.level);
  const questionType = useAppStore((s) => s.practiceConfig.questionType);
  const currentIndex = useAppStore((s) => s.session.currentIndex);
  const sessionStatus = useAppStore((s) => s.session.status);
  const extendQuestions = useAppStore((s) => s.extendQuestions);

  // Reset adaptive state when a new session starts
  useEffect(() => {
    if (sessionStatus === 'active') {
      adaptiveStateRef.current = createAdaptiveState();
      questionStartTimeRef.current = Date.now();
    }
  }, [sessionStatus]);

  // Track answer timing and correctness when currentIndex advances
  useEffect(() => {
    if (!isAdaptive || sessionStatus !== 'active' || currentIndex === 0) return;

    const sessionState = useAppStore.getState();
    const prevAnswer = sessionState.session.answers[currentIndex - 1];
    if (prevAnswer === undefined) return;

    const now = Date.now();
    const timeMs = now - questionStartTimeRef.current;

    // Determine if the previous answer was correct
    const prevQuestion = sessionState.session.questions[currentIndex - 1];
    const isCorrect = prevAnswer !== null && prevAnswer !== 'skipped' && prevQuestion !== undefined && prevAnswer === prevQuestion.answer;

    // Only record non-skipped answers
    if (prevAnswer !== 'skipped') {
      adaptiveStateRef.current = recordAnswer(
        adaptiveStateRef.current,
        isCorrect,
        timeMs,
        baseLevel,
        questionType,
      );
    }

    lastCorrectRef.current = isCorrect;

    // Start timing the current question
    questionStartTimeRef.current = now;

    // Check if we need to extend the question buffer
    const appState = useAppStore.getState();
    const remainingQuestions = appState.session.questions.length - appState.session.currentIndex;
    if (remainingQuestions <= 5) {
      // Generate more questions at the current adaptive difficulty
      const config = getAdaptiveConfig(baseLevel, adaptiveStateRef.current.offset, questionType);
      const newQuestions: typeof appState.session.questions = [];
      for (let i = 0; i < 10; i++) {
        newQuestions.push(generateQuestion(config));
      }
      extendQuestions(newQuestions);
    }
  }, [currentIndex, isAdaptive, sessionStatus, baseLevel, questionType, extendQuestions]);

  const getCurrentOffset = useCallback(() => {
    return adaptiveStateRef.current.offset;
  }, []);

  return {
    getCurrentOffset,
    isAdaptive,
  };
}
