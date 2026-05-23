import { memo } from 'react';

export const StatBlock = memo(function StatBlock({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--color-surface-container)' }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '20px', color: 'var(--color-primary)' }} role="img" aria-hidden="true"
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--color-on-surface)',
        }}
      >
        {value}
      </span>
      <span className="label-caps" style={{ fontSize: '0.75rem' }}>{label}</span>
    </div>
  );
});
