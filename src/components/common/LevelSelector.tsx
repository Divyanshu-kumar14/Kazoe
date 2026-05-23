import { useMemo } from 'react';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';
import { getRankForLevel } from './configOptions';

interface LevelSelectorProps {
  level: number;
  onLevelChange: (level: number) => void;
}

export function LevelSelector({ level, onLevelChange }: LevelSelectorProps) {
  const levels = useMemo(
    () => Object.keys(SOROBAN_LEVELS).map(Number).sort((a, b) => a - b),
    []
  );

  return (
    <div className="card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
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
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }} role="img" aria-hidden="true">emoji_events</span>
          {getRankForLevel(level)}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {levels.map((lvl) => {
          const isSelected = level === lvl;
          return (
            <button type="button"
              key={lvl}
              onClick={() => onLevelChange(lvl)}
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
    </div>
  );
}
