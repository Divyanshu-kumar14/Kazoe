import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { useAppStore } from '../store/useAppStore';

const DECIDED_BY_LABELS: Record<string, string> = {
  correct_count: 'Won by more correct answers',
  accuracy: 'Won by higher accuracy',
  efficiency: 'Won by fewer attempts',
  speed: 'Won by faster solving',
  draw: 'Perfectly matched',
};

export default function MultiplayerResults() {
  const navigate = useNavigate();
  const { match, playerNumber, scores, myAnswers, opponentAnswers } = useMultiplayerStore();
  const saveMultiplayerMatch = useAppStore(s => s.saveMultiplayerMatch);

  const myScore = playerNumber === 1 ? scores[0] : scores[1];
  const oppScore = playerNumber === 1 ? scores[1] : scores[0];
  const myId = match?.[playerNumber === 1 ? 'player1_id' : 'player2_id'];
  const isDraw = match ? match.winner_id === null : false;
  const isWinner = match ? (!isDraw && match.winner_id === myId) : false;

  const myAttempts = myAnswers.filter((a) => a !== null).length;
  const oppAttempts = opponentAnswers.filter((a) => a !== null).length;
  const myCorrect = myAnswers.filter((a) => a?.isCorrect).length;
  const oppCorrect = opponentAnswers.filter((a) => a?.isCorrect).length;
  const myAccuracy = myAttempts > 0 ? Math.round((myCorrect / myAttempts) * 100) : 0;
  const oppAccuracy = oppAttempts > 0 ? Math.round((oppCorrect / oppAttempts) * 100) : 0;

  const myTime = myAnswers
    .filter((a) => a?.isCorrect)
    .reduce((sum, a) => sum + (a?.timeTaken ?? 0), 0);
  const oppTime = opponentAnswers
    .filter((a) => a?.isCorrect)
    .reduce((sum, a) => sum + (a?.timeTaken ?? 0), 0);

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    return s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)}s`;
  };

  const decidedBy = (match?.scores as Record<string, unknown> | null)?.decided_by as string | undefined;
  const decidedLabel = decidedBy ? DECIDED_BY_LABELS[decidedBy] ?? null : null;

  useEffect(() => {
    if (match && (isWinner || isDraw || !isWinner)) {
      saveMultiplayerMatch({
        id: match.id,
        timestamp: Date.now(),
        isWinner,
        isDraw,
        myScore,
        oppScore,
        myAccuracy,
        oppAccuracy,
        myTime,
        oppTime,
      });
    }
  }, [match, isWinner, isDraw, myScore, oppScore, myAccuracy, oppAccuracy, myTime, oppTime, saveMultiplayerMatch]);

  if (!match) return null;

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10 animate-fade-in">
      <div className="max-w-lg w-full">
        <div className="text-center">
          {isDraw ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '56px', color: 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 1" }}
              >
                handshake
              </span>
              <h1 className="text-3xl font-semibold mt-3" style={{ color: 'var(--color-on-surface)' }}>
                It's a Draw!
              </h1>
            </>
          ) : isWinner ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '56px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
              >
                emoji_events
              </span>
              <h1 className="text-3xl font-semibold mt-3" style={{ color: 'var(--color-primary)' }}>
                You Win!
              </h1>
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '56px', color: 'var(--color-on-surface-variant)' }}
              >
                sentiment_dissatisfied
              </span>
              <h1 className="text-3xl font-semibold mt-3" style={{ color: 'var(--color-on-surface)' }}>
                You Lost
              </h1>
            </>
          )}
          <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            {isDraw ? 'No one takes the crown today' : isWinner ? 'Congratulations!' : 'Better luck next time!'}
          </p>
          {decidedLabel && (
            <p
              className="text-xs mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full"
              style={{
                backgroundColor: isDraw ? 'var(--color-surface-container-highest)' : isWinner ? 'var(--color-primary-container)' : 'var(--color-surface-container-highest)',
                color: isDraw ? 'var(--color-on-surface-variant)' : isWinner ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {isDraw ? 'balance' : 'info'}
              </span>
              {decidedLabel}
            </p>
          )}
        </div>

        <div className="mt-8 card p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
                You
              </div>
              <div className="text-4xl font-bold mt-1 font-mono" style={{ color: 'var(--color-primary)' }}>
                {myScore}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                correct
              </div>
            </div>
            <div className="px-6">
              <span className="text-xl font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>-</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
                Opponent
              </div>
              <div className="text-4xl font-bold mt-1 font-mono" style={{ color: 'var(--color-secondary)' }}>
                {oppScore}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                correct
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
            Your Stats
          </h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-container)' }}>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Correct</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{myCorrect}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Attempts</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{myAttempts}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Accuracy</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{myAccuracy}%</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Time</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{formatTime(myTime)}</div>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold uppercase tracking-wider mt-5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Opponent Stats
          </h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-container)' }}>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Correct</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{oppCorrect}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Attempts</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{oppAttempts}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Accuracy</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{oppAccuracy}%</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Time</div>
                <div className="mt-0.5 font-mono font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>{formatTime(oppTime)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              useMultiplayerStore.getState().reset();
              navigate('/multiplayer', { replace: true });
            }}
            className="btn-secondary flex-1 justify-center"
          >
            Back to Lobby
          </button>
          <button
            onClick={() => {
              useMultiplayerStore.getState().reset();
              navigate('/multiplayer', { replace: true });
            }}
            className="btn-primary flex-1 justify-center"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
