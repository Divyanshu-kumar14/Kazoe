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

function computeGrade(accuracy: number, qpm: number, targetQPM: number): Grade {
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
  const stats = answers.reduce((acc, a, i) => {
    if (a === 'skipped') acc.skipped++;
    else if (a !== null) {
      acc.attempted++;
      if (a === questions[i]?.answer) acc.correct++;
    }
    return acc;
  }, { skipped: 0, attempted: 0, correct: 0 });

  const skipped   = stats.skipped;
  const attempted = stats.attempted;
  const correct   = stats.correct;
  const wrong     = attempted - correct;
  const totalCount = attempted + skipped;
  const accuracy  = attempted > 0 ? (correct / attempted) * 100 : 0;
  const timeUsed  = (finishedAt - startedAt) / 1000;
  const qpm       = timeUsed > 0 ? (totalCount / timeUsed) * 60 : 0;

  let streak = 0, bestStreak = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === questions[i]?.answer) { streak++; bestStreak = Math.max(bestStreak, streak); }
    else streak = 0;
  }

  return {
    totalAttempted: totalCount, totalCorrect: correct,
    totalSkipped: skipped, totalWrong: wrong,
    accuracyPercent: Math.round(accuracy * 10) / 10,
    questionsPerMinute: Math.round(qpm * 10) / 10,
    timeUsedSeconds: Math.round(timeUsed),
    bestStreak,
    grade: computeGrade(accuracy, qpm, config.targetQPM),
  };
}
