export type Operation = 'addition' | 'subtraction' | 'mixed_add_sub' | 'multiplication' | 'division' | 'mixed_all';
export type CarryMode = 'none' | 'with_carry' | 'mixed';

export interface LevelConfig {
  level: number;           // 1 (easiest) to 10 (hardest) — real Indian abacus system
  operations: Operation;
  digitCount: number;      // max digits per operand
  rowCount: number;        // number of operands per question
  carryMode: CarryMode;
  targetQPM: number;       // questions per minute target
  targetAccuracy: number;  // % accuracy target
}

/**
 * Indian Abacus Level System
 * Level 1 = Beginner (easiest) → Level 10 = Grandmaster (hardest)
 *
 * Progression mirrors how real abacus institutes teach:
 *   1-2: Single-digit addition only (build finger confidence)
 *   3-4: Single/two-digit mixed add/sub (introduce subtraction)
 *   5-6: Two/three-digit with carry
 *   7-8: Three/four-digit mixed operations
 *   9-10: Four/five-digit with all operations (mastery)
 */
export const SOROBAN_LEVELS: Record<number, LevelConfig> = {
  1:  { level: 1,  operations: 'addition',       digitCount: 1, rowCount: 3, carryMode: 'none',       targetQPM: 10, targetAccuracy: 90 },
  2:  { level: 2,  operations: 'mixed_add_sub',  digitCount: 1, rowCount: 4, carryMode: 'none',       targetQPM: 15, targetAccuracy: 90 },
  3:  { level: 3,  operations: 'mixed_add_sub',  digitCount: 2, rowCount: 4, carryMode: 'mixed',      targetQPM: 20, targetAccuracy: 88 },
  4:  { level: 4,  operations: 'mixed_add_sub',  digitCount: 2, rowCount: 5, carryMode: 'mixed',      targetQPM: 25, targetAccuracy: 85 },
  5:  { level: 5,  operations: 'mixed_add_sub',  digitCount: 3, rowCount: 5, carryMode: 'with_carry', targetQPM: 30, targetAccuracy: 85 },
  6:  { level: 6,  operations: 'mixed_add_sub',  digitCount: 3, rowCount: 6, carryMode: 'with_carry', targetQPM: 35, targetAccuracy: 83 },
  7:  { level: 7,  operations: 'mixed_add_sub',  digitCount: 4, rowCount: 6, carryMode: 'with_carry', targetQPM: 40, targetAccuracy: 80 },
  8:  { level: 8,  operations: 'mixed_all',      digitCount: 4, rowCount: 7, carryMode: 'with_carry', targetQPM: 45, targetAccuracy: 80 },
  9:  { level: 9,  operations: 'mixed_all',      digitCount: 5, rowCount: 7, carryMode: 'with_carry', targetQPM: 50, targetAccuracy: 78 },
  10: { level: 10, operations: 'mixed_all',      digitCount: 5, rowCount: 8, carryMode: 'with_carry', targetQPM: 60, targetAccuracy: 75 },
};
