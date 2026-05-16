import type { LevelConfig } from './levelConfig';
import type { Question } from './questionGenerator';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface SessionResult {
  totalAttempted: number;
  totalCorrect: number;
  totalSkipped: number;
  totalWrong: number;
  accuracyPercent: number;
  questionsPerMinute: number;
  timeUsedSeconds: number;
  bestStreak: number;
  grade: Grade;
}

export function computeGrade(accuracy: number, qpm: number, targetQPM: number): Grade {
  const speedRatio = qpm / targetQPM;
  if (accuracy >= 95 && speedRatio >= 1.0) return 'S';
  if (accuracy >= 88 && speedRatio >= 0.8) return 'A';
  if (accuracy >= 75 && speedRatio >= 0.6) return 'B';
  if (accuracy >= 60)                      return 'C';
  return 'D';
}

export function computeSessionResult(
  answers: (number | 'skipped' | null)[],
  questions: Question[],
  config: LevelConfig,
  startedAt: number,
  finishedAt: number
): SessionResult {
  const attempted = answers.filter((a) => a !== null).length;
  const correct   = answers.filter((a, i) => a === questions[i]?.answer).length;
  const skipped   = answers.filter((a) => a === 'skipped').length;
  const wrong     = attempted - correct - skipped;
  const accuracy  = attempted > 0 ? (correct / attempted) * 100 : 0;
  const timeUsed  = (finishedAt - startedAt) / 1000;
  const qpm       = timeUsed > 0 ? (attempted / timeUsed) * 60 : 0;

  // Best streak
  let streak = 0, bestStreak = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === questions[i]?.answer) { streak++; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
  }

  return {
    totalAttempted: attempted, totalCorrect: correct,
    totalSkipped: skipped, totalWrong: wrong,
    accuracyPercent: Math.round(accuracy * 10) / 10,
    questionsPerMinute: Math.round(qpm * 10) / 10,
    timeUsedSeconds: Math.round(timeUsed),
    bestStreak,
    grade: computeGrade(accuracy, qpm, config.targetQPM),
  };
}
