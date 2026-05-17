import { describe, it, expect } from 'vitest';
import { generateQuestions, MULT_DIFFICULTY, DIV_DIFFICULTY } from './questionGenerator';
import { SOROBAN_LEVELS } from './levelConfig';

describe('questionGenerator', () => {
  it('never produces negative intermediate totals', () => {
    // Run 1000 questions at each level and verify running totals
    for (let level = 1; level <= 10; level++) {
      const config = SOROBAN_LEVELS[level];
      const questions = generateQuestions(config, 1000, `SEED_${level}`);
      
      questions.forEach(q => {
        let runningTotal = 0;
        q.operands.forEach(op => {
          runningTotal += op;
          expect(runningTotal).toBeGreaterThanOrEqual(0);
        });
      });
    }
  });

  it('produces identical questions for the same seed', () => {
    const config = SOROBAN_LEVELS[4]; // Level 4 = Intermediate (2-digit, 5 rows)
    const q1 = generateQuestions(config, 20, 'SEED123');
    const q2 = generateQuestions(config, 20, 'SEED123');
    expect(q1).toEqual(q2);
  });

  it('produces different questions for different seeds', () => {
    const config = SOROBAN_LEVELS[4];
    const q1 = generateQuestions(config, 20, 'SEED123');
    const q2 = generateQuestions(config, 20, 'SEED456');
    expect(q1).not.toEqual(q2);
  });

  it('respects digit count constraints for addition/subtraction', () => {
    // Level 4 = 2 digits => max 99
    const config = SOROBAN_LEVELS[4];
    const maxVal = Math.pow(10, config.digitCount) - 1;
    
    const questions = generateQuestions(config, 100, 'TEST_DIGITS');
    questions.forEach(q => {
      q.operands.forEach(op => {
        expect(Math.abs(op)).toBeLessThanOrEqual(maxVal);
      });
    });
  });

  it('respects row count from config', () => {
    // Level 4 = rowCount: 5
    const config = SOROBAN_LEVELS[4];
    const questions = generateQuestions(config, 10, 'TEST_ROWS');
    questions.forEach(q => {
      expect(q.operands.length).toBe(config.rowCount);
    });
  });

  it('level 1 only produces addition', () => {
    const config = SOROBAN_LEVELS[1]; // Level 1 = addition only
    const questions = generateQuestions(config, 100, 'TEST_ADD_ONLY');
    questions.forEach(q => {
      q.operands.forEach(op => {
        expect(op).toBeGreaterThan(0);
      });
    });
  });

  it('final answer is always non-negative', () => {
    for (let level = 1; level <= 10; level++) {
      const config = SOROBAN_LEVELS[level];
      const questions = generateQuestions(config, 500, `ANSWER_${level}`);
      questions.forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('generates correct multiplication questions', () => {
    const config = SOROBAN_LEVELS[4]; // 2-digit
    const d = MULT_DIFFICULTY[config.level];
    const questions = generateQuestions(config, 100, 'MUL_TEST', 'multiplication');
    questions.forEach(q => {
      expect(q.operation).toBe('multiplication');
      expect(q.operands.length).toBe(2);
      expect(q.operands[0]).toBeGreaterThanOrEqual(d.multiplicandMin);
      expect(q.operands[0]).toBeLessThanOrEqual(d.multiplicandMax);
      expect(q.operands[1]).toBeGreaterThanOrEqual(d.multiplierMin);
      expect(q.operands[1]).toBeLessThanOrEqual(d.multiplierMax);
      expect(q.answer).toBe(q.operands[0] * q.operands[1]);
    });
  });

  it('generates correct division questions', () => {
    const config = SOROBAN_LEVELS[4]; // 2-digit
    const d = DIV_DIFFICULTY[config.level];
    const questions = generateQuestions(config, 100, 'DIV_TEST', 'division');
    questions.forEach(q => {
      expect(q.operation).toBe('division');
      expect(q.operands.length).toBe(2);
      expect(q.operands[1]).toBeGreaterThanOrEqual(d.divisorMin);
      expect(q.operands[1]).toBeLessThanOrEqual(d.divisorMax);
      expect(q.operands[0]).toBe(q.operands[1] * q.answer);
      expect(q.operands[0]).toBeGreaterThanOrEqual(d.dividendMin);
      expect(q.operands[0]).toBeLessThanOrEqual(d.dividendMax);
    });
  });

  it('generates multiplication questions at all levels', () => {
    for (let level = 1; level <= 10; level++) {
      const config = SOROBAN_LEVELS[level];
      const d = MULT_DIFFICULTY[config.level];
      const questions = generateQuestions(config, 50, `MUL_L${level}`, 'multiplication');
      questions.forEach(q => {
        expect(q.answer).toBe(q.operands[0] * q.operands[1]);
        expect(q.operands[0]).toBeGreaterThanOrEqual(d.multiplicandMin);
        expect(q.operands[0]).toBeLessThanOrEqual(d.multiplicandMax);
        expect(q.operands[1]).toBeGreaterThanOrEqual(d.multiplierMin);
        expect(q.operands[1]).toBeLessThanOrEqual(d.multiplierMax);
      });
    }
  });

  it('generates division questions at all levels', () => {
    for (let level = 1; level <= 10; level++) {
      const config = SOROBAN_LEVELS[level];
      const d = DIV_DIFFICULTY[config.level];
      const questions = generateQuestions(config, 50, `DIV_L${level}`, 'division');
      questions.forEach(q => {
        expect(q.operands[0]).toBe(q.operands[1] * q.answer);
        expect(q.operands[0]).toBeGreaterThanOrEqual(d.dividendMin);
        expect(q.operands[0]).toBeLessThanOrEqual(d.dividendMax);
        expect(q.operands[1]).toBeGreaterThanOrEqual(d.divisorMin);
        expect(q.operands[1]).toBeLessThanOrEqual(d.divisorMax);
      });
    }
  });

  it('produces deterministic multiplication questions for same seed', () => {
    const config = SOROBAN_LEVELS[4];
    const q1 = generateQuestions(config, 20, 'SEEDMUL', 'multiplication');
    const q2 = generateQuestions(config, 20, 'SEEDMUL', 'multiplication');
    expect(q1).toEqual(q2);
  });

  it('produces deterministic division questions for same seed', () => {
    const config = SOROBAN_LEVELS[4];
    const q1 = generateQuestions(config, 20, 'SEEDDIV', 'division');
    const q2 = generateQuestions(config, 20, 'SEEDDIV', 'division');
    expect(q1).toEqual(q2);
  });
});
