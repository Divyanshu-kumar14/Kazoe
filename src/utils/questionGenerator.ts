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

  // First operand: positive starting value within digit range
  // For addition-only, leave room for (rowCount - 1) minimum additions of 1
  // For subtraction-heavy configs, bias higher to ensure room for subtraction
  const minFirst = additionOnly ? 1 : Math.max(1, Math.floor(maxVal * 0.3));
  const firstMax = additionOnly ? Math.max(minFirst, maxVal - (config.rowCount - 1)) : maxVal;
  const first = Math.max(minFirst, Math.floor(rng() * Math.max(firstMax, 1)) + 1);
  operands.push(first);
  let runningTotal = first;

  for (let i = 1; i < config.rowCount; i++) {
    // Determine whether we want to subtract this step
    const wantSubtract = !additionOnly && (
      config.operations === 'subtraction' ||
      config.operations === 'mixed_all' ||
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
      // Fallback: keep total unchanged (should be unreachable with correct bounds)
      operands.push(0);
    }
  }

  return { operands, answer: runningTotal, seed: '', operation: 'add_sub' };
}

/* ═══════════════════════════════════════════════════════════════════
 * MULTIPLICATION — Level-based difficulty scaling
 *
 *  Level  Multiplicand      Multiplier     Example
 *  1      2-digit (10-99)   1-digit (2-9)  45 × 7
 *  2      3-digit (100-999) 1-digit (2-9)  232 × 8
 *  3      3-digit           1-digit        547 × 6
 *  4      4-digit           1-digit        3421 × 5
 *  5      4-digit           1-digit        7856 × 9
 *  6      3-digit           2-digit (11-99) 342 × 27
 *  7      4-digit           2-digit        2345 × 34
 *  8      5-digit           1-digit        45678 × 7
 *  9      5-digit           2-digit        23456 × 45
 *  10     5-digit+          2-digit        67890 × 78
 * ═══════════════════════════════════════════════════════════════════ */
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

function generateMultiplicationQuestion(config: LevelConfig, rng: () => number): Question {
  const level = Math.max(1, Math.min(10, config.level));
  const difficulty = MULT_DIFFICULTY[level]!;
  const multiplicand = Math.floor(rng() * (difficulty.multiplicandMax - difficulty.multiplicandMin + 1)) + difficulty.multiplicandMin;
  const multiplier = Math.floor(rng() * (difficulty.multiplierMax - difficulty.multiplierMin + 1)) + difficulty.multiplierMin;
  return { operands: [multiplicand, multiplier], answer: multiplicand * multiplier, seed: '', operation: 'multiplication' };
}

/* ═══════════════════════════════════════════════════════════════════
 * DIVISION — Level-based difficulty scaling
 *
 * Generated as (divisor × quotient) ÷ divisor → always whole-number answer
 *
 *  Level  Dividend Digits  Divisor         Example
 *  1      2-digit          1-digit (2-9)   72 ÷ 8
 *  2      3-digit          1-digit         256 ÷ 4
 *  3      3-4 digit        1-digit         2384 ÷ 2
 *  4      4-digit          1-digit         5670 ÷ 9
 *  5      4-5 digit        1-digit         23762 ÷ 4 (approx)
 *  6      5-digit          1-digit         45678 ÷ 6
 *  7      5-digit          2-digit (11-99) 34560 ÷ 12
 *  8      5-6 digit        2-digit         123456 ÷ 24
 *  9      6-digit          2-digit         567890 ÷ 45
 *  10     6-7 digit        2-digit         1234560 ÷ 78
 * ═══════════════════════════════════════════════════════════════════ */
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
  const divisor = Math.floor(rng() * (difficulty.divisorMax - difficulty.divisorMin + 1)) + difficulty.divisorMin;
  const quotientMin = Math.max(2, Math.ceil(difficulty.dividendMin / divisor));
  const quotientMax = Math.max(quotientMin, Math.floor(difficulty.dividendMax / divisor));
  const quotient = Math.floor(rng() * (quotientMax - quotientMin + 1)) + quotientMin;
  const dividend = divisor * quotient;
  return { operands: [dividend, divisor], answer: quotient, seed: '', operation: 'division' };
}

/**
 * Public API: Generate N questions deterministically from a seed.
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
 * Public API: Generate a single question (non-deterministic).
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
