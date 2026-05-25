import { useMemo } from 'react';
import type { DailyActivity } from '../../utils/analytics';

interface Props {
  data: DailyActivity[];
}

export default function ActivityHeatmap({ data }: Props) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const maxSessions = Math.max(...data.map(d => d.sessionCount), 1);
    const W = 600;
    const H = 160;
    const pad = { top: 10, right: 10, bottom: 30, left: 10 };
    const chartW = W - pad.left - pad.right;

    const barWidth = Math.min(16, chartW / data.length - 2);

    const bars = data.map((d, i) => {
      const x = pad.left + (i / data.length) * chartW + (chartW / data.length - barWidth) / 2;
      const barH = maxSessions > 0 ? (d.sessionCount / maxSessions) * (H - pad.top - pad.bottom - 10) : 0;
      const y = H - pad.bottom - barH;
      const dayNum = parseInt(d.date.split('-')[2]!, 10);

      // Determine color intensity
      let opacity = 0.1;
      if (d.sessionCount > 0) {
        opacity = 0.2 + (d.sessionCount / maxSessions) * 0.7;
      }

      return { x, y, barW: barWidth, barH, dayNum, ...d, opacity };
    });

    // Day labels every 5 days
    const dayLabels = bars.filter((_, i) => i % 5 === 0 || i === bars.length - 1);

    return { W, H, bars, dayLabels, maxSessions };
  }, [data]);

  if (!chart || chart.maxSessions === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">calendar_month</span>
          <span className="label-caps">30-Day Activity</span>
        </div>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
          No sessions in the last 30 days.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">calendar_month</span>
          <span className="label-caps">30-Day Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>Light</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
              <div
                key={o}
                className="size-3 rounded-sm"
                style={{ backgroundColor: `rgba(var(--color-primary-rgb), ${o})` }}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>Heavy</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${chart.W} ${chart.H}`} style={{ width: '100%', height: 'auto' }}>
        {chart.bars.map((bar, i) => (
          <g key={i}>
            <rect
              x={bar.x} y={bar.y} width={bar.barW} height={Math.max(bar.barH, bar.barH > 0 ? 3 : 0)}
              rx="2" ry="2"
              fill={`var(--color-primary)`}
              opacity={bar.opacity}
              style={{ transition: 'opacity 0.2s ease' }}
            >
              <title>
                {bar.date}: {bar.sessionCount} session{bar.sessionCount !== 1 ? 's' : ''} ({bar.totalCorrect} correct)
              </title>
            </rect>
          </g>
        ))}

        {/* Day labels */}
        {chart.dayLabels.map((bar, i) => (
          <text
            key={`label-${i}`}
            x={bar.x + bar.barW / 2}
            y={chart.H - 6}
            textAnchor="middle"
            style={{
              fill: 'var(--color-on-surface-variant)',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {bar.dayNum}
          </text>
        ))}
      </svg>
    </div>
  );
}
