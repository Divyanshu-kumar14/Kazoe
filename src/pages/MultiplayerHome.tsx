import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef, memo } from 'react';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { SOROBAN_LEVELS } from '../utils/levelConfig';
import { generateQuestion } from '../utils/questionGenerator';
import { subscribeToMatchUpdate } from '../lib/multiplayer';
import { extractError } from '../lib/errors';
import { LevelSelector } from '../components/common/LevelSelector';
import { QuestionTypeSelector } from '../components/common/QuestionTypeSelector';
import { DurationSlider } from '../components/common/DurationSlider';
import { QuestionPreview } from '../components/common/QuestionPreview';
import type { QuestionType } from '../components/common/configOptions';

type Tab = 'create' | 'join';

export default memo(function MultiplayerHome() {
  const navigate = useNavigate();
  const { userId, isAuthenticating, matchId, matchStatus, isCreator, multiplayerConfig, setMultiplayerConfig } = useMultiplayerStore();
  const [tab, setTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const isWaiting = matchStatus === 'waiting' && isCreator && matchId;
  const [waitingTimeout, setWaitingTimeout] = useState(false);

  useEffect(() => {
    if ((matchStatus === 'countdown' || matchStatus === 'playing') && matchId) {
      navigate('/multiplayer/game/' + matchId, { replace: true });
    }
  }, [matchStatus, matchId, navigate]);

  // Timeout for creator waiting — if opponent hasn't joined after 60s, show option to cancel
  useEffect(() => {
    if (!isWaiting) return;
    setWaitingTimeout(false);
    const timer = setTimeout(() => setWaitingTimeout(true), 60_000);
    return () => clearTimeout(timer);
  }, [isWaiting]);

  useEffect(() => {
    if (!isWaiting) return;
    let active = true;
    let channel: ReturnType<typeof subscribeToMatchUpdate> extends Promise<infer T> ? T : never;
    let recovering = false;

    subscribeToMatchUpdate(matchId, async (updated) => {
      if (!active) return;
      if (updated.status === 'active') {
        // Guard against concurrent recoverMatch calls
        if (recovering) return;
        recovering = true;
        try {
          await useMultiplayerStore.getState().recoverMatch(matchId);
          // Eagerly unsubscribe this channel after successful recovery
          // to prevent duplicate DB subscriptions when the game page mounts
          if (channel) {
            channel.unsubscribe();
          }
        } catch (err) {
          console.error('Failed to recover match on transition to active:', err);
          // Retry recovering the match after a short delay of 1000ms.
          if (active) {
            setTimeout(async () => {
              if (!active) return;
              try {
                await useMultiplayerStore.getState().recoverMatch(matchId);
                if (channel) {
                  channel.unsubscribe();
                }
              } catch (retryErr) {
                console.error('Retry to recover match failed:', retryErr);
              } finally {
                recovering = false;
              }
            }, 1000);
            return; // Don't reset recovering here — the timeout will
          }
        }
        recovering = false;
      }
    }).then((c) => {
      if (!active) {
        c.unsubscribe();
      } else {
        channel = c;
        unsubRef.current = () => c.unsubscribe();
      }
    });

    return () => {
      active = false;
      if (channel) {
        channel.unsubscribe();
      }
      unsubRef.current = null;
    };
  }, [isWaiting, matchId]);

  const currentLevelConfig = SOROBAN_LEVELS[multiplayerConfig.level]!;

  const sampleOperands = useMemo(() => {
    if (multiplayerConfig.questionType === 'multiplication' || multiplayerConfig.questionType === 'division') {
      const cfg = SOROBAN_LEVELS[multiplayerConfig.level]!;
      const q = generateQuestion(cfg, { operations: multiplayerConfig.questionType });
      return [
        { sign: '', value: q.operands[0]! },
        { sign: multiplayerConfig.questionType === 'multiplication' ? '×' : '÷', value: q.operands[1]! },
      ];
    }
    const rc = currentLevelConfig.rowCount;
    const ops: { sign: string; value: number }[] = [];
    for (let i = 0; i < rc; i++) {
      ops.push({ sign: i === 0 ? '' : '+' , value: i === 0 ? 1 : (i < rc ? i + 1 : rc) });
    }
    return ops;
  }, [multiplayerConfig.questionType, multiplayerConfig.level, currentLevelConfig.rowCount]);

  const handleCreate = async () => {
    if (!userId || loading) return;
    setLoading(true);
    setError(null);
    try {
      await useMultiplayerStore.getState().createPrivateMatch();
    } catch (e) {
      setError(extractError(e, 'Failed to create room'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const normalized = roomCode.toUpperCase().replace(/-/g, '');
    if (normalized.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await useMultiplayerStore.getState().joinPrivateMatch(normalized);
    } catch (e) {
      setError(extractError(e, 'Room not found or already taken'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRoom = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    useMultiplayerStore.getState().reset();
  };

  const canPlay = !isAuthenticating && !!userId;

  if (isWaiting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
        <div className="max-w-sm w-full text-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '48px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }} role="img" aria-hidden="true"
          >
            group_add
          </span>
          <h2 className="text-2xl font-semibold mt-4" style={{ color: 'var(--color-on-surface)' }}>
            Room Created
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            Share this code with your opponent
          </p>

          <div className="mt-6 p-4 card">
            <div
              className="text-4xl font-bold tracking-widest select-all"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
            >
              {matchId!.slice(0, 3)}-{matchId!.slice(3)}
            </div>
            <button type="button"
              onClick={() => navigator.clipboard.writeText(matchId!)}
              className="mt-3 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
              }}
            >
              Copy Code
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin" style={{ color: 'var(--color-primary)' }} role="img" aria-hidden="true">
              hourglass_top
            </span>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              Waiting for opponent to join…
            </p>
            {waitingTimeout && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-status-error)' }}>
                Taking longer than expected. You can cancel and try again.
              </p>
            )}
            <button type="button"
              onClick={handleCancelRoom}
              className="mt-2 px-4 py-2 text-sm rounded-md transition-colors"
              style={{ color: 'var(--color-status-error)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '48px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }} role="img" aria-hidden="true"
          >
            swords
          </span>
          <h1 className="text-3xl font-semibold mt-2" style={{ color: 'var(--color-on-surface)' }}>
            Multiplayer
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            Configure your match, then create or join a room
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 flex flex-col gap-6">
            <LevelSelector
              level={multiplayerConfig.level}
              onLevelChange={(lvl) => setMultiplayerConfig({ level: lvl })}
            />

            <div className="card p-6 flex flex-col gap-6">
              <QuestionTypeSelector
                questionType={multiplayerConfig.questionType as QuestionType}
                onQuestionTypeChange={(qt) => setMultiplayerConfig({ questionType: qt })}
              />

              <DurationSlider
                timeLimitSeconds={multiplayerConfig.timeLimitSeconds}
                onDurationChange={(t) => setMultiplayerConfig({ timeLimitSeconds: t })}
                ariaLabel="Match Duration in Minutes"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="card p-6 flex flex-col items-center gap-4">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, alignSelf: 'start' }}>
                Preview
              </h2>

              <QuestionPreview
                questionType={multiplayerConfig.questionType as QuestionType}
                sampleOperands={sampleOperands}
              />
            </div>

            <div className="card p-6">
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-outline-variant)' }}>
                <button type="button"
                  onClick={() => { setTab('create'); setError(null); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'create' ? 'font-bold' : ''}`}
                  style={{
                    backgroundColor: tab === 'create' ? 'var(--color-primary)' : 'transparent',
                    color: tab === 'create' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                  }}
                >
                  Create Room
                </button>
                <button type="button"
                  onClick={() => { setTab('join'); setError(null); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'join' ? 'font-bold' : ''}`}
                  style={{
                    backgroundColor: tab === 'join' ? 'var(--color-primary)' : 'transparent',
                    color: tab === 'join' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                  }}
                >
                  Join Room
                </button>
              </div>

              <div className="mt-5">
                {tab === 'create' ? (
                  <div className="text-center">
                    <p className="text-sm mb-5" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Create a room and share the code with a friend
                    </p>
                    <button type="button"
                      onClick={handleCreate}
                      disabled={!canPlay || loading}
                      className="btn-primary w-full justify-center"
                    >
                      {loading ? 'Creating…' : 'Create Room'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Enter the 6-character code from your opponent
                    </p>
                    <input
                      value={roomCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                        if (val.length <= 7) setRoomCode(val);
                      }}
                      placeholder="XXX-XXX"
                      aria-label="Room Code"
                      className="input-field text-center text-2xl tracking-widest"
                      style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                      maxLength={7}
                      disabled={loading}
                    />
                    <button type="button"
                      onClick={handleJoin}
                      disabled={roomCode.replace(/-/g, '').length !== 6 || loading}
                      className="btn-primary w-full justify-center mt-4"
                    >
                      {loading ? 'Joining…' : 'Join Room'}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm text-center" style={{ color: 'var(--color-status-error)' }}>
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {isAuthenticating && (
          <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-on-surface-variant)' }}>
            Signing in…
          </p>
        )}
      </div>
    </div>
  );
});
