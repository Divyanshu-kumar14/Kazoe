import type { LevelMastery } from '../../utils/analytics';

interface Props {
  data: LevelMastery[];
}

const LEVEL_COLORS = [
  '#78909c', '#26a69a', '#42a5f5', '#ab47bc', '#ef5350',
  '#ff7043', '#ffa726', '#fdd835', '#66bb6a', '#29b6f6',
];

function gradeColor(grade: string) {
  switch (grade) {
    case 'S': return '#f59e0b';
    case 'A': return '#10b981';
    case 'B': return '#3b82f6';
    case 'C': return '#8b5cf6';
    default: return '#6b7280';
  }
}

export default function LevelMasteryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">bar_chart</span>
          <span className="label-caps">Level Mastery</span>
        </div>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
          Complete sessions across different levels to see mastery data.
        </p>
      </div>
    );
  }

  const maxAccuracy = Math.max(...data.map(d => d.avgAccuracy), 50);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">bar_chart</span>
        <span className="label-caps">Level Mastery</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.map((level) => {
          const barWidth = Math.max((level.avgAccuracy / maxAccuracy) * 100, 8);
          const color = LEVEL_COLORS[(level.level - 1) % LEVEL_COLORS.length]!;
          return (
            <div key={level.level} className="flex items-center gap-3">
              {/* Level label */}
              <span
                className="text-xs font-bold flex-shrink-0"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-on-surface-variant)',
                  width: '3rem',
                  textAlign: 'right',
                }}
              >
                Lv.{level.level}
              </span>

              {/* Bar */}
              <div
                className="flex-1 h-8 rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-container)' }}
              >
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                    minWidth: '3rem',
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#fff', fontFamily: 'var(--font-mono)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                  >
                    {level.avgAccuracy}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '6rem' }}>
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
                >
                  {level.avgQpm} QPM
                </span>
                <span
                  className="size-5 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: gradeColor(level.bestGrade),
                    color: '#fff',
                  }}
                >
                  {level.bestGrade}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>
        Bars show average accuracy per level. Best grade shown on right.
      </p>
    </div>
  );
}
