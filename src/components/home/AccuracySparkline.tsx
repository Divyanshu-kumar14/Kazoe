import { memo } from 'react';

export const AccuracySparkline = memo(function AccuracySparkline({ history }: { history: { result: { accuracyPercent: number } }[] }) {
  const recent = history;
  if (recent.length < 2) return null;

  const W = 300;
  const H = 60;
  const pad = 4;
  const chartW = W - pad * 2;
  const chartH = H - pad * 2;

  const points = recent.map((h, i) => {
    const x = pad + (i / (recent.length - 1)) * chartW;
    const y = pad + chartH - (h.result.accuracyPercent / 100) * chartH;
    return { x, y, accuracy: h.result.accuracyPercent };
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">
          trending_up
        </span>
        <span className="label-caps">Accuracy Trend</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <polyline
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
        />
        {points.map((p, idx) => {
          const ptKey = `spark-pt-${idx}-${p.accuracy}`;
          return (
          <circle
            key={ptKey}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--color-primary)"
            stroke="var(--color-surface-lowest)"
            strokeWidth="1.5"
          >
            <title>{p.accuracy}%</title>
          </circle>
        )})}
      </svg>
    </div>
  );
});
