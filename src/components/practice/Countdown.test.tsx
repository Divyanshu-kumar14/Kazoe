import { render, act } from '@testing-library/react';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Countdown } from './Countdown';

vi.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playTick: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('Countdown decrements and calls onDone', () => {
  const onDone = vi.fn();
  const { getByText } = render(<Countdown onDone={onDone} />);
  
  expect(getByText('3')).toBeInTheDocument();
  
  act(() => { vi.advanceTimersByTime(1000); });
  expect(getByText('2')).toBeInTheDocument();
  
  act(() => { vi.advanceTimersByTime(1000); });
  expect(getByText('1')).toBeInTheDocument();
  
  act(() => { vi.advanceTimersByTime(1000); });
  expect(getByText('Go!')).toBeInTheDocument();
  
  act(() => { vi.advanceTimersByTime(1000); });
  expect(onDone).toHaveBeenCalled();
});
