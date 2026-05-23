interface DurationSliderProps {
  timeLimitSeconds: number;
  onDurationChange: (timeLimitSeconds: number) => void;
  ariaLabel?: string;
}

export function DurationSlider({ timeLimitSeconds, onDurationChange, ariaLabel = 'Duration in minutes' }: DurationSliderProps) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <span className="label-caps">Duration (Minutes)</span>
      <input
        type="range"
        aria-label={ariaLabel}
        min={0.5}
        max={15}
        step={0.5}
        value={timeLimitSeconds / 60}
        onChange={(e) => onDurationChange(Math.round(Number(e.target.value) * 60))}
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
  );
}
