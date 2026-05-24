import seedrandom from 'seedrandom';
import type { LevelConfig } from './levelConfig';

export interface Question {
  operands: number[];           // signed: positive = add, negative = subtract
  answer: number;
  seed: string;
  operation: 'add_sub' | 'multiplication' | 'division';
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

  const first = pickInitialOperand(maxVal, config.rowCount, additionOnly, rng);
  operands.push(first);
  let runningTotal = first;

  for (let i = 1; i < config.rowCount; i++) {
    const operand = pickNextAddSubOperand(runningTotal, maxVal, config.operations, additionOnly, rng);
    operands.push(operand);
    runningTotal += operand;
  }

  return { operands, answer: runningTotal, seed: '', operation: 'add_sub' };
}

function pickInitialOperand(maxVal: number, rowCount: number, additionOnly: boolean, rng: () => number): number {
  const minFirst = additionOnly ? 1 : Math.max(1, Math.floor(maxVal * 0.3));
  const firstMax = additionOnly ? Math.max(minFirst, maxVal - (rowCount - 1)) : maxVal;
  return Math.max(minFirst, Math.floor(rng() * Math.max(firstMax, 1)) + 1);
}

function pickNextAddSubOperand(
  runningTotal: number,
  maxVal: number,
  operations: LevelConfig['operations'],
  additionOnly: boolean,
  rng: () => number
): number {
  const wantSubtract = !additionOnly && (
    operations === 'subtraction' ||
    operations === 'mixed_all' ||
    (operations === 'mixed_add_sub' && rng() > 0.5)
  );

  const canSubtract = !additionOnly && runningTotal > 0;
  const roomToAdd = maxVal - runningTotal;
  const canAdd = roomToAdd >= 1;

  if (wantSubtract && canSubtract) {
    const operand = Math.max(1, Math.floor(rng() * runningTotal));
    return -operand;
  }

  if (canAdd) {
    const operand = Math.max(1, Math.floor(rng() * roomToAdd));
    return operand;
  }

  if (canSubtract) {
    const operand = Math.max(1, Math.floor(rng() * runningTotal));
    return -operand;
  }

  return 0;
}

export interface MultDifficultyEntry {
  multiplicandMin: number;
  multiplicandMax: number;
  multiplierMin: number;
  multiplierMax: number;
}

export const MULT_DIFFICULTY: Record<number, MultDifficultyEntry> = {
  1:  { multiplicandMin: 10,    multiplicandMax: 99,    multiplierMin: 2,  multiplierMax: 9 },
  2:  { multiplicandMin: 100,   multiplicandMax: 999,   multiplierMin: 2,  multiplierMax: 9 },
  3:  { multiplicandMin: 100,   multiplicandMax: 999,   multiplierMin: 2,  multiplierMax: 9 },
  4:  { multiplicandMin: 1000,  multiplicandMax: 9999,  multiplierMin: 2,  multiplierMax: 9 },
  5:  { multiplicandMin: 1000,  multiplicandMax: 9999,  multiplierMin: 2,  multiplierMax: 9 },
  6:  { multiplicandMin: 100,   multiplicandMax: 999,   multiplierMin: 11, multiplierMax: 99 },
  7:  { multiplicandMin: 1000,  multiplicandMax: 9999,  multiplierMin: 11, multiplierMax: 99 },
  8:  { multiplicandMin: 10000, multiplicandMax: 99999, multiplierMin: 2,  multiplierMax: 9 },
  9:  { multiplicandMin: 10000, multiplicandMax: 99999, multiplierMin: 11, multiplierMax: 99 },
  10: { multiplicandMin: 10000, multiplicandMax: 99999, multiplierMin: 11, multiplierMax: 99 },
};

function randomInRange(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateMultiplicationQuestion(config: LevelConfig, rng: () => number): Question {
  const level = Math.max(1, Math.min(10, config.level));
  const difficulty = MULT_DIFFICULTY[level]!;
  const multiplicand = randomInRange(rng, difficulty.multiplicandMin, difficulty.multiplicandMax);
  const multiplier = randomInRange(rng, difficulty.multiplierMin, difficulty.multiplierMax);
  return { operands: [multiplicand, multiplier], answer: multiplicand * multiplier, seed: '', operation: 'multiplication' };
}

export interface DivDifficultyEntry {
  dividendMin: number;
  dividendMax: number;
  divisorMin: number;
  divisorMax: number;
}

export const DIV_DIFFICULTY: Record<number, DivDifficultyEntry> = {
  1:  { dividendMin: 10,     dividendMax: 99,      divisorMin: 2,  divisorMax: 9 },
  2:  { dividendMin: 100,    dividendMax: 999,     divisorMin: 2,  divisorMax: 9 },
  3:  { dividendMin: 100,    dividendMax: 9999,    divisorMin: 2,  divisorMax: 9 },
  4:  { dividendMin: 1000,   dividendMax: 9999,    divisorMin: 2,  divisorMax: 9 },
  5:  { dividendMin: 1000,   dividendMax: 99999,   divisorMin: 2,  divisorMax: 9 },
  6:  { dividendMin: 10000,  dividendMax: 99999,   divisorMin: 2,  divisorMax: 9 },
  7:  { dividendMin: 10000,  dividendMax: 99999,   divisorMin: 11, divisorMax: 99 },
  8:  { dividendMin: 10000,  dividendMax: 999999,  divisorMin: 11, divisorMax: 99 },
  9:  { dividendMin: 100000, dividendMax: 999999,  divisorMin: 11, divisorMax: 99 },
  10: { dividendMin: 100000, dividendMax: 9999999, divisorMin: 11, divisorMax: 99 },
};

function generateDivisionQuestion(config: LevelConfig, rng: () => number): Question {
  const level = Math.max(1, Math.min(10, config.level));
  const difficulty = DIV_DIFFICULTY[level]!;
  const divisor = randomInRange(rng, difficulty.divisorMin, difficulty.divisorMax);
  const quotientMin = Math.max(2, Math.ceil(difficulty.dividendMin / divisor));
  const quotientMax = Math.max(quotientMin, Math.floor(difficulty.dividendMax / divisor));
  const quotient = randomInRange(rng, quotientMin, quotientMax);
  const dividend = divisor * quotient;
  return { operands: [dividend, divisor], answer: quotient, seed: '', operation: 'division' };
}

/**
 * Generate N questions deterministically from a seed.
 * Same seed + same config = identical question set, every time.
 */
export function generateQuestions(
  config: LevelConfig,
  count: number,
  seed: string,
  operation: 'add_sub' | 'multiplication' | 'division' = 'add_sub'
): Question[] {
  const rng = seedrandom(seed);
  const questions: Question[] = [];
  const generator = operation === 'multiplication' ? generateMultiplicationQuestion
            : operation === 'division' ? generateDivisionQuestion
            : generateAddSubQuestion;

  for (let i = 0; i < count; i++) {
    const question = generator(config, rng);
    question.seed = seed;
    questions.push(question);
  }

  return questions;
}

export function generateSeed(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * 36)];
  return result;
}

/**
 * Generate a single question (non-deterministic).
 * Accepts optional overrides for level config fields.
 */
export function generateQuestion(
  config: LevelConfig,
  overrides?: Partial<LevelConfig>
): Question {
  const operation = overrides?.operations || config.operations;
  const rng = seedrandom(generateSeed());
  const generator = operation === 'multiplication' ? generateMultiplicationQuestion
            : operation === 'division' ? generateDivisionQuestion
            : generateAddSubQuestion;
  const question = generator(overrides ? { ...config, ...overrides } : config, rng);
  question.seed = generateSeed();
  return question;
}
