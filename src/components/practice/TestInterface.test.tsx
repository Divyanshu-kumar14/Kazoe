import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { TestInterface } from './TestInterface';
import { BrowserRouter } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

// ─── Hoisted mocks for controlled dictation state ───

const { mockDictation } = vi.hoisted(() => {
  const mockDictation = {
    speak: vi.fn(),
    stop: vi.fn(),
    speaking: false,
    supported: true,
    usable: true,
  };
  return { mockDictation };
});

vi.mock('../../hooks/useDictation', () => ({
  useDictation: () => mockDictation,
}));

vi.mock('../../store/useAppStore', () => {
  const useAppStoreMock = vi.fn();
  (useAppStoreMock as unknown as { getState: () => unknown }).getState = () => ({
    session: {
      questions: [{ operands: [1, 1], answer: 2, operation: 'add_sub' }],
    },
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

// Countdown mock: schedules onDone for next tick to transition to playing phase
vi.mock('./Countdown', () => ({
  Countdown: ({ onDone }: { onDone: () => void }) => {
    setTimeout(() => onDone?.(), 50);
    return <div>countdown</div>;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───

test('renders countdown initially', () => {
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

  expect(getByText('countdown')).toBeInTheDocument();
});

test('renders DictationInput when dictation is enabled and usable', async () => {
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
        dictation: true,
      },
      submitAnswer: vi.fn(),
      endSession: vi.fn(),
    };
    return (selector as (s: typeof state) => unknown)(state);
  });

  mockDictation.usable = true;
  mockDictation.speaking = false;

  render(
    <BrowserRouter>
      <TestInterface />
    </BrowserRouter>
  );

  // Wait for countdown to finish and dictation UI to appear
  await waitFor(
    () => {
      expect(screen.getByText('Question ready')).toBeInTheDocument();
    },
    { timeout: 2000 },
  );
});

test('shows unavailable banner when dictation is enabled but TTS is not usable', async () => {
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
        dictation: true,
      },
      submitAnswer: vi.fn(),
      endSession: vi.fn(),
    };
    return (selector as (s: typeof state) => unknown)(state);
  });

  mockDictation.usable = false;
  mockDictation.speaking = false;

  render(
    <BrowserRouter>
      <TestInterface />
    </BrowserRouter>
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Dictation unavailable/)).toBeInTheDocument();
    },
    { timeout: 2000 },
  );
});

test('shows visual question when dictation is off', async () => {
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
        dictation: false,
      },
      submitAnswer: vi.fn(),
      endSession: vi.fn(),
    };
    return (selector as (s: typeof state) => unknown)(state);
  });

  mockDictation.usable = true;

  render(
    <BrowserRouter>
      <TestInterface />
    </BrowserRouter>
  );

  // Wait for countdown to finish, then verify visual question UI (= symbol visible)
  await waitFor(
    () => {
      expect(screen.getByText('=')).toBeInTheDocument();
    },
    { timeout: 2000 },
  );
});
