import { memo, useEffect, useState, useMemo } from 'react';
import { getLeaderboard, type Profile } from '../../lib/profile';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';

export const Leaderboard = memo(function Leaderboard({ userScore }: { userScore: number }) {
  const [{ leaderboard, isLoading }, setState] = useState<{ leaderboard: Profile[], isLoading: boolean }>({
    leaderboard: [],
    isLoading: true
  });
  const currentUserId = useMultiplayerStore((s) => s.userId);
  const currentUsername = useMultiplayerStore((s) => s.username);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setState(prev => ({ ...prev, isLoading: true }));
      const data = await getLeaderboard(50);
      if (mounted) {
        setState({ leaderboard: data, isLoading: false });
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const displayData = useMemo(() => {
    if (isLoading) return { displayPlayers: [], userRankStr: '-', actualRank: -1 };

    const players = [...leaderboard];
    let userRank = -1;
    let userInTop = false;

    for (let i = 0; i < players.length; i++) {
      if (players[i].id === currentUserId) {
        userRank = i + 1;
        userInTop = true;
        break;
      }
    }

    let userRankStr = userInTop ? String(userRank) : '-';

    if (!userInTop && currentUserId) {
      players.push({
        id: currentUserId,
        username: currentUsername || 'You',
        points: userScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      players.sort((a, b) => b.points - a.points);
      userRank = players.findIndex((p) => p.id === currentUserId) + 1;
      userRankStr = `>${leaderboard.length}`;
    }

    let displayPlayers = players.slice(0, 5);
    
    if (userRank > 5) {
      displayPlayers = [
        ...players.slice(0, 3),
        { id: 'ellipsis', username: '...', points: -1 } as Profile,
        players[userRank - 2],
        players[userRank - 1],
      ].filter(Boolean);
    }

    return {
      displayPlayers,
      userRankStr: userRank > 0 ? userRankStr : '-',
      actualRank: userRank
    };
  }, [leaderboard, isLoading, currentUserId, currentUsername, userScore]);

  return (
    <div className="card p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', color: 'var(--color-primary)' }}
        >
          leaderboard
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            margin: 0,
          }}
        >
          Global Leaderboard
        </h2>
      </div>
      
      <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
        Your Rank: <strong>{displayData.userRankStr.startsWith('>') ? '' : '#'}{displayData.userRankStr}</strong>
      </p>

      <div className="flex flex-col gap-2 mt-2">
        {isLoading ? (
          <div className="text-sm text-center py-4 text-gray-500">Loading leaderboard&hellip;</div>
        ) : displayData.displayPlayers.length === 0 ? (
          <div className="text-sm text-center py-4 text-gray-500">No data available</div>
        ) : (
          displayData.displayPlayers.map((player) => {
            if (player.id === 'ellipsis') {
              return (
                <div key="ellipsis-separator" className="flex justify-center py-1">
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)', fontSize: '20px' }}>
                    more_vert
                  </span>
                </div>
              );
            }

            // Find actual rank in the full list
            const sortedAll = [...leaderboard, ...(displayData.actualRank > leaderboard.length && currentUserId ? [{id: currentUserId, points: userScore}] as Profile[] : [])].sort((a,b) => b.points - a.points);
            const rankNum = sortedAll.findIndex(p => p.id === player.id) + 1;
            const isUser = player.id === currentUserId;
            
            let medalColor = 'transparent';
            let textColor = 'var(--color-on-surface-variant)';
            
            if (rankNum === 1) {
              medalColor = '#fbbf24'; // Gold
              textColor = '#fff';
            } else if (rankNum === 2) {
              medalColor = '#9ca3af'; // Silver
              textColor = '#fff';
            } else if (rankNum === 3) {
              medalColor = '#b45309'; // Bronze
              textColor = '#fff';
            }

            return (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: isUser ? 'var(--color-primary-container)' : 'var(--color-surface-container)',
                  border: isUser ? '1px solid var(--color-primary)' : '1px solid transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="size-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                    style={{
                      backgroundColor: medalColor !== 'transparent' ? medalColor : 'var(--color-surface-container-high)',
                      color: medalColor !== 'transparent' ? textColor : 'var(--color-on-surface)',
                    }}
                  >
                    {rankNum}
                  </div>
                  <span
                    className="text-sm font-semibold truncate max-w-[120px]"
                    title={player.username}
                    style={{ color: isUser ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)' }}
                  >
                    {player.username}
                  </span>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: 'var(--font-mono)', color: isUser ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}
                >
                  {player.points.toLocaleString()} pts
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

