import type { Grade } from '../../utils/grading';

interface HistoryEntry {
  id: string;
  timestamp: number;
  grade: Grade;
  level: number;
  result: {
    totalCorrect: number;
    totalAttempted: number;
    accuracyPercent: number;
    timeUsedSeconds: number;
  };
}

interface RecentSessionsProps {
  last5: HistoryEntry[];
  formatTimeAgo: (timestamp: number) => string;
  gradeColor: (grade: Grade) => string;
}

export function RecentSessions({ last5, formatTimeAgo, gradeColor }: RecentSessionsProps) {
  if (last5.length === 0) return null;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', color: 'var(--color-primary)' }}
        >
          history
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            margin: 0,
          }}
        >
          Recent Sessions
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {last5.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              transition: 'background-color 0.2s',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="size-9 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: gradeColor(entry.grade),
                  color: '#fff',
                }}
              >
                {entry.grade}
              </span>
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  Level {entry.level}: {entry.result.totalCorrect}/{entry.result.totalAttempted}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {formatTimeAgo(entry.timestamp)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-sm"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
              >
                {Math.round(entry.result.accuracyPercent)}%
              </span>
              <span
                className="text-sm"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
              >
                {entry.result.timeUsedSeconds}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
