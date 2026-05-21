import { memo } from 'react';

export const BadgeGrid = memo(function BadgeGrid({ badges }: { badges: Array<{ id: string; name: string; description: string; icon: string; unlocked: boolean; unlockedAt: number | null }> }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
          emoji_events
        </span>
        <span className="label-caps">Achievements</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: badge.unlocked
                ? 'var(--color-primary-container)'
                : 'var(--color-surface-container)',
              opacity: badge.unlocked ? 1 : 0.4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                color: badge.unlocked ? 'var(--color-on-primary-container)' : 'var(--color-outline)',
              }}
            >
              {badge.icon}
            </span>
            <span
              className="text-xs font-semibold"
              style={{
                color: badge.unlocked ? 'var(--color-on-surface)' : 'var(--color-outline)',
              }}
            >
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
