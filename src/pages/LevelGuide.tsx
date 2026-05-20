import { useMemo, memo } from 'react';
import { SOROBAN_LEVELS } from '../utils/levelConfig';

function getRank(level: number) {
  if (level <= 2) return { label: 'Beginner', color: '#6e7979', bg: '#ebe8e3' };
  if (level <= 4) return { label: 'Intermediate', color: '#00595c', bg: '#e0f5f5' };
  if (level <= 6) return { label: 'Advanced', color: '#855300', bg: '#ffecd4' };
  if (level <= 8) return { label: 'Expert', color: '#7b2d00', bg: '#ffe0cc' };
  if (level <= 9) return { label: 'Master', color: '#ba1a1a', bg: '#ffdad6' };
  return { label: 'Grandmaster', color: '#7b0012', bg: '#ffdad6' };
}

function getRankIcon(level: number) {
  if (level <= 2) return 'brightness_auto';
  if (level <= 4) return 'psychology';
  if (level <= 6) return 'workspace_premium';
  if (level <= 8) return 'military_tech';
  if (level <= 9) return 'diamond';
  return 'emoji_events';
}

export default memo(function LevelGuide() {
  const levels = useMemo(
    () => Object.values(SOROBAN_LEVELS).sort((a, b) => a.level - b.level),
    []
  );

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1000px] mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-3">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Indian Abacus Level Guide
          </h1>
          <p
            className="max-w-xl mx-auto"
            style={{
              color: 'var(--color-on-surface-variant)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: 1.7,
            }}
          >
            The official progression path from Level 1 (Beginner) to Level 10 (Grandmaster).
            <br />
            Master each level to unlock more complex operations.
          </p>
        </div>

        {/* Table */}
        <div className="card overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
                  {['Level', 'Rank', 'Operations', 'Digits', 'Rows'].map((h) => (
                    <th
                      key={h}
                      className="label-caps px-5 py-3 text-left"
                      style={{
                        borderBottom: '1px solid var(--color-outline-variant)',
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levels.map((l, i) => {
                  const rank = getRank(l.level);
                  const icon = getRankIcon(l.level);
                  const isLast = i === levels.length - 1;
                  return (
                    <tr
                      key={l.level}
                      className="transition-colors hover-row"
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? 'var(--color-surface-lowest)'
                            : 'var(--color-surface-container-low)',
                        borderBottom: isLast ? 'none' : '1px solid var(--color-outline-variant)',
                      }}
                    >
                      <td
                        className="px-5 py-4"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 500,
                          fontSize: '1.125rem',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {l.level}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: rank.bg,
                            color: rank.color,
                            letterSpacing: '0.03em',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {icon}
                          </span>
                          {rank.label}
                        </span>
                      </td>
                      <td
                        className="px-5 py-4 capitalize"
                        style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}
                      >
                        {l.operations.replace(/_/g, ' ')}
                      </td>
                      <td
                        className="px-5 py-4"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {l.digitCount}
                      </td>
                      <td
                        className="px-5 py-4"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {l.rowCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6 flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', color: 'var(--color-primary)' }}
              >
                info
              </span>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                Digit Counts
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}
              >
                Refers to the maximum number of digits in any single number within the problem set.
              </p>
            </div>
          </div>

          <div className="card p-6 flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', color: 'var(--color-secondary)' }}
              >
                stacked_line_chart
              </span>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  margin: 0,
                }}
              >
                No Negative Totals
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}
              >
                Just like a real abacus — the running total never goes below zero during any step of the calculation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});
