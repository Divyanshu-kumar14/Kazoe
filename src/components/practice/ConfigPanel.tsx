import { useAppStore } from '../../store/useAppStore';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

// Indian abacus system: Level 1 = Beginner, Level 10 = Grandmaster
function getRankForLevel(lvl: number) {
  if (lvl <= 2) return 'Beginner';
  if (lvl <= 4) return 'Intermediate';
  if (lvl <= 6) return 'Advanced';
  if (lvl <= 8) return 'Expert';
  if (lvl <= 9) return 'Master';
  return 'Grandmaster';
}

export function ConfigPanel() {
  const level = useAppStore((s) => s.practiceConfig.level);
  const timeLimitSeconds = useAppStore((s) => s.practiceConfig.timeLimitSeconds);
  const overrides = useAppStore((s) => s.practiceConfig.overrides);
  const setConfig = useAppStore((s) => s.setPracticeConfig);
  const startSession = useAppStore((s) => s.startSession);
  const navigate = useNavigate();

  const handleStart = () => {
    startSession();
    navigate('/practice/session');
  };

  const levels = useMemo(
    () => Object.keys(SOROBAN_LEVELS).map(Number).sort((a, b) => a - b),
    []
  );

  const currentLevelConfig = SOROBAN_LEVELS[level];

  // Generate a sample question for preview
  const sampleOperands = useMemo(() => {
    const rc = overrides.rowCount ?? currentLevelConfig.rowCount;
    const max = Math.pow(10, currentLevelConfig.digitCount) - 1;
    const additionOnly = currentLevelConfig.operations === 'addition';
    const ops: { sign: string; value: number }[] = [];
    for (let i = 0; i < rc; i++) {
      const val = i === 0 ? 1 : (i < max ? i + 1 : max);
      ops.push({ sign: i === 0 ? '' : (additionOnly ? '+' : '+' ), value: val });
    }
    return ops;
  }, [overrides.rowCount, currentLevelConfig.digitCount, currentLevelConfig.operations, currentLevelConfig.rowCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

      {/* ─── Left: Mastery Level Grid ─── */}
      <div className="md:col-span-3 card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Mastery Level
          </h2>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
              letterSpacing: '0.05em',
            }}
          >
            🏆 {getRankForLevel(level)}
          </span>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-5 gap-3">
          {levels.map((lvl) => {
            const isSelected = level === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setConfig({ level: lvl })}
                className="aspect-square rounded-lg flex items-center justify-center text-xl font-bold transition-all"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: isSelected
                    ? '3px solid var(--color-primary)'
                    : '1px solid var(--color-outline-variant)',
                  backgroundColor: isSelected
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-container-low)',
                  color: isSelected
                    ? 'var(--color-on-primary)'
                    : 'var(--color-on-surface)',
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(0,89,92,0.25)'
                    : 'none',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        {/* Duration + Seed row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="card p-4 flex flex-col gap-3">
            <span className="label-caps">Duration (Minutes)</span>
            <input
              type="range"
              min={0.5}
              max={15}
              step={0.5}
              value={timeLimitSeconds / 60}
              onChange={(e) => setConfig({ timeLimitSeconds: Math.round(Number(e.target.value) * 60) })}
              className="w-full accent-[var(--color-primary)]"
            />
            <div className="flex justify-between text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
              <span>1</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontSize: '0.875rem',
                }}
              >
                {Math.round(timeLimitSeconds / 60 * 10) / 10}
              </span>
              <span>15</span>
            </div>
          </div>

          {/* Rows Override */}
          <div className="card p-4 flex flex-col gap-3">
            <span className="label-caps">Rows (Operands)</span>
            <select
              className="input-field"
              value={overrides.rowCount || ''}
               onChange={(e) => {
                 const val = e.target.value;
                 setConfig({
                   overrides: {
                     ...overrides,
                     rowCount: val ? Number(val) : undefined,
                   },
                 });
              }}
            >
              <option value="">Default ({currentLevelConfig.rowCount})</option>
              {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Right: Sheet Preview + Begin ─── */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="card p-6 flex flex-col items-center gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              margin: 0,
              alignSelf: 'start',
            }}
          >
            Sheet Preview
          </h2>

          {/* Mock question column */}
          <div
            className="w-full rounded-lg p-8 flex flex-col items-center"
            style={{
              backgroundColor: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            <div className="flex flex-col items-end gap-2">
              {sampleOperands.map((op, i) => (
                <div key={i} className="flex items-baseline gap-4">
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      color: 'var(--color-on-surface-variant)',
                      width: '1.5rem',
                      textAlign: 'right',
                    }}
                  >
                    {op.sign}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '2.5rem',
                      fontWeight: 500,
                      color: 'var(--color-on-surface)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {op.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="w-full my-4"
              style={{ height: '2px', backgroundColor: 'var(--color-outline-variant)' }}
            />

            <div
              className="w-full rounded-md py-2 text-center"
              style={{
                border: '1px dashed var(--color-outline-variant)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-outline)',
                fontSize: '0.875rem',
              }}
            >
              Answer Here
            </div>
          </div>

          <button
            onClick={handleStart}
            className="btn-primary w-full justify-center py-3 text-base"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
            Begin Practice
          </button>
        </div>
      </div>
    </div>
  );
}
