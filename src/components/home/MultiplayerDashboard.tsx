import { StatBlock } from './StatBlock';

interface MatchHistory {
  id: string;
  isWinner: boolean;
  isDraw: boolean;
  timestamp: number;
  myScore: number;
  oppScore: number;
  myAccuracy: number;
}

interface MultiplayerDashboardProps {
  hasMultiplayerHistory: boolean;
  mpStats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    avgAccuracy: number;
    last5: MatchHistory[];
  };
  formatTimeAgo: (timestamp: number) => string;
}

export function MultiplayerDashboard({ hasMultiplayerHistory, mpStats, formatTimeAgo }: MultiplayerDashboardProps) {
  if (!hasMultiplayerHistory) return null;

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', color: 'var(--color-primary)' }} role="img" aria-hidden="true"
        >
          sports_esports
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            margin: 0,
          }}
        >
          Multiplayer Stats
        </h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          icon="emoji_events"
          label="Win Rate"
          value={`${Math.round(mpStats.winRate)}%`}
        />
        <StatBlock
          icon="group"
          label="Matches"
          value={`${mpStats.totalMatches}`}
        />
        <StatBlock
          icon="check_circle"
          label="Avg Accuracy"
          value={`${Math.round(mpStats.avgAccuracy)}%`}
        />
        <StatBlock
          icon="history"
          label="W / D / L"
          value={`${mpStats.wins} / ${mpStats.draws} / ${mpStats.losses}`}
        />
      </div>

      {mpStats.last5.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Recent Matches
          </h3>
          {mpStats.last5.map((match) => {
            let outcomeStr = 'Defeat';
            let outcomeColor = '#ef4444';
            if (match.isWinner) {
              outcomeStr = 'Victory';
              outcomeColor = '#10b981';
            } else if (match.isDraw) {
              outcomeStr = 'Draw';
              outcomeColor = '#f59e0b';
            }
            
            return (
              <div
                key={match.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  transition: 'background-color 0.2s',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-9 rounded-lg flex items-center justify-center material-symbols-outlined text-white font-bold"
                    style={{ backgroundColor: outcomeColor }} role="img" aria-hidden="true"
                  >
                    {match.isWinner ? 'emoji_events' : match.isDraw ? 'handshake' : 'close'}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-on-surface)' }}
                    >
                      {outcomeStr}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {formatTimeAgo(match.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface)' }}
                  >
                    {match.myScore} - {match.oppScore}
                  </span>
                  <span
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface-variant)' }}
                  >
                    {Math.round(match.myAccuracy)}% acc
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
