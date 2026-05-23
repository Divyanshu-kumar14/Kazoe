interface LevelBadgeProps {
  level: number;
  totalPoints: number;
  rank: {
    name: string;
    icon: string;
  };
  nextRank: {
    name: string;
    minPts: number;
  } | null;
}

export function LevelBadge({ level, totalPoints, rank, nextRank }: LevelBadgeProps) {
  return (
    <div
      className="card p-6 flex flex-col items-center justify-center gap-2 text-center"
      style={{
        backgroundColor: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
        color: 'var(--color-on-primary)',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '36px', color: 'var(--color-secondary-container)', fontVariationSettings: "'FILL' 1" }} role="img" aria-hidden="true"
      >
        {rank.icon}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
        }}
      >
        Level {level}
      </span>
      <span className="text-sm opacity-80">{rank.name}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          marginTop: '0.25rem',
        }}
      >
        {totalPoints.toLocaleString()}
      </span>
      <span className="text-xs opacity-80">
        {nextRank
          ? `${nextRank.minPts - totalPoints} pts to ${nextRank.name}`
          : 'Max Rank Achieved!'}
      </span>
    </div>
  );
}
