import { describe, it, expect } from 'vitest';
import { generateQuestions } from './questionGenerator';
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

  it('respects digit count constraints', () => {
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
});
