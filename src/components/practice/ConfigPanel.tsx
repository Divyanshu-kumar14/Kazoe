import { useAppStore } from '../../store/useAppStore';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';
import { generateQuestion } from '../../utils/questionGenerator';
import { useNavigate } from 'react-router-dom';
import { useMemo, memo } from 'react';
import { LevelSelector } from '../common/LevelSelector';
import { QuestionTypeSelector } from '../common/QuestionTypeSelector';
import { DurationSlider } from '../common/DurationSlider';
import { QuestionPreview } from '../common/QuestionPreview';
import type { QuestionType } from '../common/configOptions';

export const ConfigPanel = memo(function ConfigPanel() {
  const level = useAppStore((s) => s.practiceConfig.level);
  const timeLimitSeconds = useAppStore((s) => s.practiceConfig.timeLimitSeconds);
  const overrides = useAppStore((s) => s.practiceConfig.overrides);
  const questionType = useAppStore((s) => s.practiceConfig.questionType);
  const adaptiveDifficulty = useAppStore((s) => s.practiceConfig.adaptiveDifficulty) ?? false;
  const focusMode = useAppStore((s) => s.practiceConfig.focusMode) ?? false;
  const dictation = useAppStore((s) => s.practiceConfig.dictation) ?? false;
  const setConfig = useAppStore((s) => s.setPracticeConfig);
  const startSession = useAppStore((s) => s.startSession);
  const navigate = useNavigate();

  const handleStart = () => {
    startSession();
    navigate('/practice/session');
  };

  const currentLevelConfig = SOROBAN_LEVELS[level]!;

  const sampleOperands = useMemo(() => {
    if (questionType === 'multiplication' || questionType === 'division') {
      const cfg = SOROBAN_LEVELS[level]!;
      const q = generateQuestion(cfg, { operations: questionType });
      const sym = questionType === 'multiplication' ? '×' : '÷';
      return [
        { sign: '', value: q.operands[0]! },
        { sign: sym, value: q.operands[1]! },
      ];
    }
    const rc = overrides.rowCount ?? currentLevelConfig.rowCount;
    const max = Math.pow(10, currentLevelConfig.digitCount) - 1;
    const ops: { sign: string; value: number }[] = [];
    for (let i = 0; i < rc; i++) {
      const val = i === 0 ? 1 : (i < max ? i + 1 : max);
      ops.push({ sign: i === 0 ? '' : '+' , value: val });
    }
    return ops;
  }, [questionType, level, overrides.rowCount, currentLevelConfig.digitCount, currentLevelConfig.rowCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

      <div className="md:col-span-3 flex flex-col gap-6">
        <LevelSelector
          level={level}
          onLevelChange={(lvl) => setConfig({ level: lvl })}
        />

        <div className="card p-6 flex flex-col gap-6">
          <QuestionTypeSelector
            questionType={questionType as QuestionType}
            onQuestionTypeChange={(qt) => setConfig({ questionType: qt })}
          />

          <div className="card p-4 flex flex-col gap-3">
            <span className="label-caps">Difficulty Mode</span>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: adaptiveDifficulty ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                }}
                onClick={() => setConfig({ adaptiveDifficulty: !adaptiveDifficulty })}
              >
                <span
                  className="inline-block size-5 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: adaptiveDifficulty ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  Adaptive Difficulty
                </span>
                <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {adaptiveDifficulty
                    ? 'Questions adjust in real-time based on your performance'
                    : 'Fixed difficulty based on level preset'}
                </span>
              </div>
            </label>
          </div>

          <div className="card p-4 flex flex-col gap-3">
            <span className="label-caps">Session Mode</span>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: focusMode ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                }}
                onClick={() => setConfig({ focusMode: !focusMode })}
              >
                <span
                  className="inline-block size-5 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: focusMode ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                  Focus Mode
                </span>
                <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {focusMode
                    ? 'Auto-fullscreen with minimal UI. Hover top area to reveal timer.'
                    : 'Standard session with full controls visible'}
                </span>
              </div>
            </label>
          </div>

          {questionType === 'add_sub' && (
            <div className="card p-4 flex flex-col gap-3">
              <span className="label-caps">Dictation</span>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: dictation ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                  }}
                  onClick={() => setConfig({ dictation: !dictation })}
                >
                  <span
                    className="inline-block size-5 rounded-full bg-white transition-transform shadow-sm"
                    style={{ transform: dictation ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Dictation Mode
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {dictation
                      ? 'Voice reads questions aloud — answer without seeing the problem'
                      : 'Listen to questions spoken aloud (requires browser TTS support)'}
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DurationSlider
              timeLimitSeconds={timeLimitSeconds}
              onDurationChange={(t) => setConfig({ timeLimitSeconds: t })}
            />

            {questionType === 'add_sub' && !adaptiveDifficulty && (
              <div className="card p-4 flex flex-col gap-3">
                <span className="label-caps">Rows (Operands)</span>
                <select
                  className="input-field"
                  aria-label="Row count override"
                  value={overrides.rowCount || ''}
                   onChange={(e) => {
                     const val = e.target.value;
                     setConfig({
                       overrides: {
                         ...overrides,
                         rowCount: val ? Number(val) : undefined,
                       },
                     });
                  }}
                >
                  <option value="">Default ({currentLevelConfig.rowCount})</option>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="card p-6 flex flex-col items-center gap-4">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
              alignSelf: 'start',
            }}
          >
            Sheet Preview
          </h2>

          <QuestionPreview
            questionType={questionType as QuestionType}
            sampleOperands={sampleOperands}
          />

          <button type="button"
            onClick={handleStart}
            className="btn-primary w-full justify-center py-3 text-base"
            style={{ fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }} role="img" aria-hidden="true">play_arrow</span>
            Begin Practice
          </button>
        </div>
      </div>
    </div>
  );
});
