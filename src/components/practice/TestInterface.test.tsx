import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { TestInterface } from './TestInterface';
import { BrowserRouter } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

vi.mock('../../store/useAppStore', () => {
  const useAppStoreMock = vi.fn();
  (useAppStoreMock as unknown as { getState: () => unknown }).getState = () => ({
    session: {
      questions: [{ operands: [1, 1], answer: 2, operation: 'add_sub' }]
    }
  });
  return { useAppStore: useAppStoreMock };
});

vi.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playTick: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
  }),
}));

test('TestInterface renders countdown initially', () => {
  vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
    const state = {
      session: {
        status: 'active',
        currentIndex: 0,
        questions: [{ operands: [1, 1], answer: 2, operation: 'add_sub' }],
      },
      practiceConfig: {
        timeLimitSeconds: 60,
        level: 1,
      },
      submitAnswer: vi.fn(),
      endSession: vi.fn(),
    };
    return (selector as (s: typeof state) => unknown)(state);
  });

  const { getByText } = render(
    <BrowserRouter>
      <TestInterface />
    </BrowserRouter>
  );

  expect(getByText('3')).toBeInTheDocument();
});
