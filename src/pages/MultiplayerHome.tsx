import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef, memo } from 'react';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { SOROBAN_LEVELS } from '../utils/levelConfig';
import { generateQuestion } from '../utils/questionGenerator';
import { subscribeToMatchUpdate } from '../lib/multiplayer';
import { extractError } from '../lib/errors';

const QUESTION_TYPE_OPTIONS = [
  { value: 'add_sub' as const, label: 'Add / Sub', icon: 'add' },
  { value: 'multiplication' as const, label: 'Multiply', icon: 'close' },
  { value: 'division' as const, label: 'Division', icon: '÷' },
];

type Tab = 'create' | 'join';

function getRankForLevel(lvl: number) {
  if (lvl <= 2) return 'Beginner';
  if (lvl <= 4) return 'Intermediate';
  if (lvl <= 6) return 'Advanced';
  if (lvl <= 8) return 'Expert';
  if (lvl <= 9) return 'Master';
  return 'Grandmaster';
}

export default memo(function MultiplayerHome() {
  const navigate = useNavigate();
  const { userId, isAuthenticating, matchId, matchStatus, isCreator, multiplayerConfig, setMultiplayerConfig } = useMultiplayerStore();
  const [tab, setTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const isWaiting = matchStatus === 'waiting' && isCreator && matchId;

  useEffect(() => {
    if (matchStatus === 'countdown' && matchId) {
      navigate('/multiplayer/game/' + matchId, { replace: true });
    }
  }, [matchStatus, matchId, navigate]);

  useEffect(() => {
    if (!isWaiting || unsubRef.current) return;

    subscribeToMatchUpdate(matchId, (updated) => {
      if (updated.status === 'active') {
        useMultiplayerStore.getState().setMatch(updated);
      }
    }).then((channel) => {
      unsubRef.current = () => channel.unsubscribe();
    });
  }, [isWaiting, matchId]);

  useEffect(() => {
    const unsub = unsubRef.current;
    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, []);

  const levels = useMemo(
    () => Object.keys(SOROBAN_LEVELS).map(Number).sort((a, b) => a - b),
    []
  );

  const currentLevelConfig = SOROBAN_LEVELS[multiplayerConfig.level]!;

  const sampleOperands = useMemo(() => {
    if (multiplayerConfig.questionType === 'multiplication' || multiplayerConfig.questionType === 'division') {
      const cfg = SOROBAN_LEVELS[multiplayerConfig.level]!;
      const q = generateQuestion(cfg, { operations: multiplayerConfig.questionType });
      return [
        { sign: '', value: q.operands[0] },
        { sign: multiplayerConfig.questionType === 'multiplication' ? '×' : '÷', value: q.operands[1] },
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
            style={{ fontSize: '48px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
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
            <span className="material-symbols-outlined animate-spin" style={{ color: 'var(--color-primary)' }}>
              hourglass_top
            </span>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              Waiting for opponent to join…
            </p>
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
            style={{ fontSize: '48px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
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
          <div className="md:col-span-3 card p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
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
                🏆 {getRankForLevel(multiplayerConfig.level)}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {levels.map((lvl) => {
                const isSelected = multiplayerConfig.level === lvl;
                return (
                  <button type="button"
                    key={lvl}
                    onClick={() => setMultiplayerConfig({ level: lvl })}
                    className="aspect-square rounded-lg flex items-center justify-center text-xl font-bold transition-all"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      border: isSelected ? '3px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                      color: isSelected ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,89,92,0.25)' : 'none',
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <span className="label-caps">Question Type</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <button type="button"
                    key={opt.value}
                    onClick={() => setMultiplayerConfig({ questionType: opt.value })}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all"
                    style={{
                      border: multiplayerConfig.questionType === opt.value ? '2px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
                      backgroundColor: multiplayerConfig.questionType === opt.value ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                      color: multiplayerConfig.questionType === opt.value ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className={opt.icon.length > 1 ? 'material-symbols-outlined' : ''}
                      style={{ fontSize: '16px', fontWeight: opt.icon.length > 1 ? undefined : 700 }}
                    >
                      {opt.icon}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4 flex flex-col gap-3">
              <span className="label-caps">Duration (Minutes)</span>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.5}
                value={multiplayerConfig.timeLimitSeconds / 60}
                onChange={(e) => setMultiplayerConfig({ timeLimitSeconds: Math.round(Number(e.target.value) * 60) })}
                aria-label="Match Duration in Minutes"
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                <span>1</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                  {Math.round(multiplayerConfig.timeLimitSeconds / 60 * 10) / 10}
                </span>
                <span>15</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="card p-6 flex flex-col items-center gap-4">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, alignSelf: 'start' }}>
                Preview
              </h2>

              <div
                className="w-full rounded-lg p-6 flex flex-col items-center"
                style={{
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                }}
              >
                {multiplayerConfig.questionType === 'multiplication' || multiplayerConfig.questionType === 'division' ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex items-baseline gap-3">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.04em' }}>
                        {sampleOperands[0]?.value ?? '97'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-primary)' }}>
                        {multiplayerConfig.questionType === 'multiplication' ? '×' : '÷'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.04em' }}>
                        {sampleOperands[1]?.value ?? '8'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-outline)' }}>
                        =
                      </span>
                    </div>
                    <div
                      className="rounded-md py-2 text-center"
                      style={{ width: '120px', border: '1px dashed var(--color-outline-variant)', borderBottom: '3px solid var(--color-outline-variant)', fontFamily: 'var(--font-mono)', color: 'var(--color-outline)', fontSize: '0.875rem', borderRadius: '0.5rem 0.5rem 0 0' }}
                    >
                      ?
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-end gap-2">
                      {sampleOperands.map((op, pos) => (
                        <div key={`preview-${op.value}-${pos}`} className="flex items-baseline gap-4">
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--color-on-surface-variant)', width: '1.5rem', textAlign: 'right' }}>{op.sign}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 500, color: 'var(--color-on-surface)', letterSpacing: '0.05em' }}>{op.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full my-4" style={{ height: '2px', backgroundColor: 'var(--color-outline-variant)' }} />
                    <div className="w-full rounded-md py-2 text-center" style={{ border: '1px dashed var(--color-outline-variant)', fontFamily: 'var(--font-mono)', color: 'var(--color-outline)', fontSize: '0.875rem' }}>
                      Answer Here
                    </div>
                  </>
                )}
              </div>
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
                <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-status-error)' }}>
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
