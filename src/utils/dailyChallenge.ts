import seedrandom from 'seedrandom';

const CHALLENGE_KEY = 'kazoe-daily-challenge';

export interface DailyChallengeStatus {
  /** ISO date string (YYYY-MM-DD) of the challenge */
  date: string;
  /** Whether the user completed today's challenge */
  completed: boolean;
  /** History entry ID if completed */
  sessionId: string | null;
}

/**
 * Returns today's date as YYYY-MM-DD.
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a deterministic seed for the daily challenge.
 * Same date = same seed = same questions for everyone.
 */
export function getDailySeed(): string {
  const date = getTodayDate();
  const rng = seedrandom(`kazoe-daily-${date}`);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let seed = '';
  for (let i = 0; i < 8; i++) {
    seed += chars[Math.floor(rng() * chars.length)];
  }
  return seed;
}

/**
 * Loads the daily challenge status from localStorage.
 */
export function loadDailyChallengeStatus(): DailyChallengeStatus {
  if (typeof window === 'undefined') {
    return { date: getTodayDate(), completed: false, sessionId: null };
  }
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyChallengeStatus;
      // If stored date matches today, return it
      if (parsed.date === getTodayDate()) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return { date: getTodayDate(), completed: false, sessionId: null };
}

/**
 * Saves the daily challenge status to localStorage.
 */
export function saveDailyChallengeStatus(status: DailyChallengeStatus): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(status));
}

/**
 * Marks today's challenge as completed.
 */
export function completeDailyChallenge(sessionId: string): void {
  saveDailyChallengeStatus({
    date: getTodayDate(),
    completed: true,
    sessionId,
  });
}
