import { useMemo, useState } from 'react';
import type { AccuracyTrendPoint } from '../../utils/analytics';

interface Props {
  data: AccuracyTrendPoint[];
}

export default function AccuracyTrendChart({ data }: Props) {
  const [hovered, setHovered] = useState<AccuracyTrendPoint | null>(null);

  const chart = useMemo(() => {
    if (data.length < 2) return null;
    const W = 600;
    const H = 260;
    const pad = { top: 20, right: 60, bottom: 30, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const maxQpm = Math.max(...data.map(d => d.qpm), 1);

    const points = data.map((d, i) => ({
      ...d,
      x: pad.left + (i / (data.length - 1)) * chartW,
      yAcc: pad.top + chartH - (d.accuracy / 100) * chartH,
      yQpm: pad.top + chartH - (d.qpm / maxQpm) * chartH,
    }));

    // Y-axis ticks for accuracy
    const accTicks = [0, 25, 50, 75, 100];

    return { W, H, pad, points, accTicks, maxQpm, chartW, chartH };
  }, [data]);

  if (!chart) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">show_chart</span>
          <span className="label-caps">Accuracy & Speed Trend</span>
        </div>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
          Complete at least 2 sessions to see your trend.
        </p>
      </div>
    );
  }

  const accLine = chart.points.map(p => `${p.x},${p.yAcc}`).join(' ');
  const qpmLine = chart.points.map(p => `${p.x},${p.yQpm}`).join(' ');

  // Y-axis tick labels
  const yAxisTicks = chart.accTicks.map(tick => ({
    y: chart.pad.top + chart.chartH - (tick / 100) * chart.chartH,
    label: `${tick}%`,
  }));

  // X-axis tick labels (show every Nth label)
  const xInterval = Math.max(1, Math.floor(chart.points.length / 6));
  const xTicks = chart.points.filter((_, i) => i % xInterval === 0 || i === chart.points.length - 1);

  // Hovered point tooltip
  const hoverPoint = hovered
    ? chart.points.find(p => p.index === hovered.index)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">show_chart</span>
          <span className="label-caps">Accuracy & Speed Trend</span>
        </div>
        {hovered && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
            Session #{hovered.index + 1} · Level {hovered.level}
          </span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${chart.W} ${chart.H}`} style={{ width: '100%', height: 'auto' }}>
          {/* Grid lines */}
          {yAxisTicks.map((tick, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={chart.pad.left} y1={tick.y}
                x2={chart.W - chart.pad.right} y2={tick.y}
                stroke="var(--color-outline-variant)"
                strokeWidth="1" strokeDasharray="4 4" opacity="0.5"
              />
              <text x={chart.pad.left - 8} y={tick.y + 4} textAnchor="end"
                style={{ fill: 'var(--color-on-surface-variant)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text x={12} y={chart.pad.top + chart.chartH / 2} textAnchor="middle"
            transform={`rotate(-90, 12, ${chart.pad.top + chart.chartH / 2})`}
            style={{ fill: 'var(--color-on-surface-variant)', fontSize: '10px', fontFamily: 'var(--font-body)' }}
          >
            Accuracy
          </text>

          {/* X-axis labels */}
          {xTicks.map((p, i) => (
            <text key={`xtick-${i}`} x={p.x} y={chart.H - chart.pad.bottom + 16} textAnchor="middle"
              style={{ fill: 'var(--color-on-surface-variant)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              {p.index + 1}
            </text>
          ))}

          {/* X-axis label */}
          <text x={chart.pad.left + chart.chartW / 2} y={chart.H - 4} textAnchor="middle"
            style={{ fill: 'var(--color-on-surface-variant)', fontSize: '10px', fontFamily: 'var(--font-body)' }}
          >
            Session #
          </text>

          {/* Accuracy line */}
          <polyline
            fill="none" stroke="var(--color-primary)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            points={accLine}
          />

          {/* QPM line */}
          <polyline
            fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeDasharray="6 3"
            strokeLinecap="round" strokeLinejoin="round"
            points={qpmLine}
          />

          {/* Dots */}
          {chart.points.map((p, idx) => (
            <g key={`dot-${idx}`}>
              <circle
                cx={p.x} cy={p.yAcc} r={hovered?.index === p.index ? 6 : 4}
                fill="var(--color-primary)" stroke="var(--color-surface-lowest)" strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>Session {p.index + 1}: {p.accuracy}% acc, {p.qpm} QPM</title>
              </circle>
              <circle
                cx={p.x} cy={p.yQpm} r={hovered?.index === p.index ? 5 : 3}
                fill="var(--color-secondary)" stroke="var(--color-surface-lowest)" strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>Session {p.index + 1}: {p.qpm} QPM</title>
              </circle>
            </g>
          ))}

          {/* Tooltip */}
          {hoverPoint && (
            <g>
              <line
                x1={hoverPoint.x} y1={chart.pad.top}
                x2={hoverPoint.x} y2={chart.pad.top + chart.chartH}
                stroke="var(--color-outline)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
              />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-2" style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
          <span className="flex items-center gap-1.5">
            <span style={{ width: '12px', height: '3px', borderRadius: '2px', backgroundColor: 'var(--color-primary)', display: 'inline-block' }} />
            Accuracy
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: '12px', height: '3px', borderRadius: '2px', backgroundColor: 'var(--color-secondary)', display: 'inline-block' }} />
            Speed (QPM)
          </span>
        </div>
      </div>
    </div>
  );
}
