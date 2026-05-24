import type { OperationBreakdown as OpData } from '../../utils/analytics';

interface Props {
  data: OpData[];
}

const OP_CONFIG: Record<string, { icon: string; label: string }> = {
  add_sub: { icon: 'add_circle', label: 'Add / Subtract' },
  multiplication: { icon: 'close', label: 'Multiplication' },
  division: { icon: 'straighten', label: 'Division' },
};

export default function OperationBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">category</span>
          <span className="label-caps">Operation Breakdown</span>
        </div>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
          No data yet.
        </p>
      </div>
    );
  }

  const getAccColor = (acc: number) => {
    if (acc >= 80) return 'var(--color-status-success)';
    if (acc >= 60) return 'var(--color-secondary)';
    return 'var(--color-status-error)';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true">category</span>
        <span className="label-caps">Operation Breakdown</span>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((op) => {
          const config = OP_CONFIG[op.operation] ?? { icon: 'help', label: op.operation };
          const accColor = getAccColor(op.accuracy);
          return (
            <div
              key={op.operation}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: 'var(--color-primary)' }} role="img" aria-hidden="true"
                  >
                    {config.icon}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {config.label}
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: accColor }}
                >
                  {op.accuracy}%
                </span>
              </div>

              {/* Accuracy bar */}
              <div
                className="w-full h-2 rounded-full overflow-hidden mb-2"
                style={{ backgroundColor: 'var(--color-surface-container-high)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${op.accuracy}%`,
                    backgroundColor: accColor,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                <span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{op.totalCorrect}</span>
                  {' / '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{op.totalAttempted}</span>
                  {' correct'}
                </span>
                <span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{op.sessionCount}</span>
                  {' session'}{op.sessionCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
