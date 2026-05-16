import seedrandom from 'seedrandom';
import type { LevelConfig } from './levelConfig';

export interface Question {
  operands: number[];           // signed: positive = add, negative = subtract
  answer: number;
  seed: string;
}

/**
 * Generates a single addition/subtraction question.
 *
 * HARD CONSTRAINTS (Indian abacus rules):
 * 1. The running total must NEVER go below 0 at any step.
 *    (You can't subtract beads you don't have.)
 * 2. If operations is 'addition', ALL operands are positive.
 * 3. Each operand's absolute value stays within the digit count ceiling.
 */
function generateAddSubQuestion(config: LevelConfig, rng: () => number): Question {
  const maxVal = Math.pow(10, config.digitCount) - 1;
  const operands: number[] = [];
  const additionOnly = config.operations === 'addition';

  // First operand: positive starting value within digit range
  // Bias higher for subtraction-heavy configs to ensure room for subtraction
  const minFirst = additionOnly ? 1 : Math.max(1, Math.floor(maxVal * 0.3));
  const first = Math.max(minFirst, Math.floor(rng() * maxVal) + 1);
  operands.push(first);
  let runningTotal = first;

  for (let i = 1; i < config.rowCount; i++) {
    // Determine whether we want to subtract this step
    const wantSubtract = !additionOnly && (
      config.operations === 'subtraction' ||
      (config.operations === 'mixed_add_sub' && rng() > 0.5)
    );

    // Calculate what's possible in each direction
    const canSubtract = !additionOnly && runningTotal > 0;
    const roomToAdd = maxVal - runningTotal;
    const canAdd = roomToAdd >= 1;

    if (wantSubtract && canSubtract) {
      // Subtract: pick value in [1, runningTotal] — total stays >= 0
      const operand = Math.max(1, Math.floor(rng() * runningTotal));
      operands.push(-operand);
      runningTotal -= operand;
    } else if (canAdd) {
      // Add: pick value in [1, roomToAdd] — total stays <= maxVal
      const operand = Math.max(1, Math.floor(rng() * roomToAdd));
      operands.push(operand);
      runningTotal += operand;
    } else if (canSubtract) {
      // Can't add (at ceiling) but can subtract — do that
      const operand = Math.max(1, Math.floor(rng() * runningTotal));
      operands.push(-operand);
      runningTotal -= operand;
    } else {
      // Edge case: can't add (at ceiling) AND can't subtract (addition-only or total=0)
      // Just add 1 — slightly exceeds digit ceiling but keeps math correct
      operands.push(1);
      runningTotal += 1;
    }
  }

  return { operands, answer: runningTotal, seed: '' };
}

/**
 * Public API: Generate N questions deterministically from a seed.
 * Same seed + same config = identical question set, every time.
 */
export function generateQuestions(
  config: LevelConfig,
  count: number,
  seed: string
): Question[] {
  const rng = seedrandom(seed);
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const q = generateAddSubQuestion(config, rng);
    q.seed = seed;
    questions.push(q);
  }

  return questions;
}

/** Generates a random alphanumeric seed */
export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Public API: Generate a single question (non-deterministic).
 * Accepts optional overrides for level config fields.
 */
export function generateQuestion(
  config: LevelConfig,
  overrides?: Partial<LevelConfig>
): Question {
  const merged = { ...config, ...overrides };
  const rng = seedrandom(generateSeed());
  const q = generateAddSubQuestion(merged, rng);
  q.seed = generateSeed();
  return q;
}
