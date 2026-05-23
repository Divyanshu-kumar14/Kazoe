import { useReducer, useMemo, useCallback } from 'react';
import { SOROBAN_LEVELS } from '../utils/levelConfig';
import { generateQuestion } from '../utils/questionGenerator';
import { type QuestionType, type SheetQuestion, getOpSymbol } from '../components/sheet/types';
import { SheetPrintPages } from '../components/sheet/SheetPrintPages';
import { SheetAnswerKey } from '../components/sheet/SheetAnswerKey';

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'add_sub', label: 'Add / Sub', icon: 'add' },
  { value: 'multiplication', label: 'Multiply', icon: 'close' },
  { value: 'division', label: 'Division', icon: 'percent' },
];

type SheetState = {
  level: number;
  questionCount: number;
  columns: number;
  rowOverride?: number;
  questionType: QuestionType;
  questions: SheetQuestion[];
  showAnswers: boolean;
};

type SheetAction =
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'SET_QUESTION_COUNT'; payload: number }
  | { type: 'SET_COLUMNS'; payload: number }
  | { type: 'SET_ROW_OVERRIDE'; payload: number | undefined }
  | { type: 'SET_QUESTION_TYPE'; payload: QuestionType }
  | { type: 'SET_QUESTIONS'; payload: SheetQuestion[] }
  | { type: 'TOGGLE_SHOW_ANSWERS' }
  | { type: 'SET_SHOW_ANSWERS'; payload: boolean };

function sheetReducer(state: SheetState, action: SheetAction): SheetState {
  switch (action.type) {
    case 'SET_LEVEL': return { ...state, level: action.payload };
    case 'SET_QUESTION_COUNT': return { ...state, questionCount: action.payload };
    case 'SET_COLUMNS': return { ...state, columns: action.payload };
    case 'SET_ROW_OVERRIDE': return { ...state, rowOverride: action.payload };
    case 'SET_QUESTION_TYPE': return { ...state, questionType: action.payload };
    case 'SET_QUESTIONS': return { ...state, questions: action.payload };
    case 'TOGGLE_SHOW_ANSWERS': return { ...state, showAnswers: !state.showAnswers };
    case 'SET_SHOW_ANSWERS': return { ...state, showAnswers: action.payload };
    default: return state;
  }
}

export default function SheetGenerator() {
  const [state, dispatch] = useReducer(sheetReducer, {
    level: 10,
    questionCount: 20,
    columns: 4,
    rowOverride: undefined,
    questionType: 'add_sub',
    questions: [],
    showAnswers: false,
  });

  const { level, questionCount, columns, rowOverride, questionType, questions, showAnswers } = state;

  const levelConfig = SOROBAN_LEVELS[level]!;
  const levels = useMemo(
    () => Object.keys(SOROBAN_LEVELS).map(Number).sort((a, b) => b - a),
    []
  );

  const isMultDiv = questionType === 'multiplication' || questionType === 'division';

  const pages = useMemo(() => {
    const perPage = isMultDiv ? 10 : 4;
    const result: SheetQuestion[][] = [];
    for (let i = 0; i < questions.length; i += perPage) {
      result.push(questions.slice(i, i + perPage));
    }
    return result;
  }, [questions, isMultDiv]);

  const answerPages = useMemo(() => {
    const answersPerPage = 20;
    const result: { qId: number; answer: number }[][] = [];
    const allAnswers = questions.map((q, i) => ({ qId: i, answer: q.answer }));
    for (let i = 0; i < allAnswers.length; i += answersPerPage) {
      result.push(allAnswers.slice(i, i + answersPerPage));
    }
    return result;
  }, [questions]);

  const handleGenerate = useCallback(() => {
    const qs: SheetQuestion[] = [];
    // Build overrides based on question type
    const overrides = questionType === 'add_sub' && rowOverride != null
      ? { rowCount: rowOverride }
      : questionType !== 'add_sub'
        ? { operations: questionType as 'multiplication' | 'division' }
        : undefined;
    for (let i = 0; i < questionCount; i++) {
      const q = generateQuestion(levelConfig, overrides);
      qs.push({ ...q, operation: questionType });
    }
    dispatch({ type: 'SET_QUESTIONS', payload: qs });
    dispatch({ type: 'SET_SHOW_ANSWERS', payload: false });
  }, [levelConfig, questionCount, questionType, rowOverride]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        
        <div className="sheet-no-print">
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-on-surface m-0">
            Sheet Generator
          </h1>
          <p className="mt-2 text-on-surface-variant text-lg">
            Generate printable practice sheets for offline drills.
          </p>
        </div>

        <div className="sheet-no-print flex flex-col gap-2">
          <span className="label-caps">Question Type</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <button type="button"
                key={opt.value}
                onClick={() => dispatch({ type: 'SET_QUESTION_TYPE', payload: opt.value })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all border-2 cursor-pointer ${
                  questionType === opt.value
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-low text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="card p-6 grid gap-4 sheet-no-print"
          style={{
            gridTemplateColumns: isMultDiv
              ? 'repeat(auto-fit, minmax(200px, 1fr))'
              : 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="level-select" className="label-caps">Level</label>
            <select
              id="level-select"
              className="input-field"
              value={level}
              onChange={(e) => dispatch({ type: 'SET_LEVEL', payload: Number(e.target.value) })}
            >
              {levels.map((l) => (
                <option key={`lvl-${l}`} value={l}>Level {l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="question-count-select" className="label-caps">Questions</label>
            <select
              id="question-count-select"
              className="input-field"
              value={questionCount}
              onChange={(e) => dispatch({ type: 'SET_QUESTION_COUNT', payload: Number(e.target.value) })}
            >
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={`n-${n}`} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {!isMultDiv && (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="columns-select" className="label-caps">Columns</label>
                <select
                  id="columns-select"
                  className="input-field"
                  value={columns}
                  onChange={(e) => dispatch({ type: 'SET_COLUMNS', payload: Number(e.target.value) })}
                >
                  {[2, 3, 4, 5].map((c) => (
                    <option key={`c-${c}`} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="rows-override-select" className="label-caps">Rows (Override)</label>
                <select
                  id="rows-override-select"
                  className="input-field"
                  value={rowOverride || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    dispatch({ type: 'SET_ROW_OVERRIDE', payload: val ? Number(val) : undefined });
                  }}
                >
                  <option value="">Default ({levelConfig.rowCount})</option>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
                    <option key={`r-${r}`} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3 sheet-no-print">
          <button type="button" onClick={handleGenerate} className="btn-primary">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Generate Sheet
          </button>
          {questions.length > 0 && (
            <>
              <button type="button" onClick={() => dispatch({ type: 'TOGGLE_SHOW_ANSWERS' })} className="btn-secondary">
                <span className="material-symbols-outlined text-lg">
                  {showAnswers ? 'visibility_off' : 'visibility'}
                </span>
                {showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
              </button>
              <button type="button" onClick={handlePrint} className="btn-secondary">
                <span className="material-symbols-outlined text-lg">print</span>
                Print
              </button>
            </>
          )}
        </div>

        {questions.length > 0 && (
          <>
            {isMultDiv ? (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
              >
                {questions.map((q, idx) => (
                  <div
                    key={`mult-q-${q.operands.join('-')}-${q.answer}`}
                    className="card px-5 py-4 flex items-center gap-4 shadow-sm"
                  >
                    {/* Question number */}
                    <span className="label-caps text-xs min-w-[2rem] text-on-surface-variant">
                      #{idx + 1}
                    </span>

                    {/* Expression */}
                    <div className="flex items-baseline gap-2 flex-1">
                      <span className="font-mono text-[1.375rem] font-semibold text-on-surface tracking-wide">
                        {q.operands[0]}
                      </span>
                      <span className="font-mono text-base font-medium text-primary">
                        {getOpSymbol(q.operation)}
                      </span>
                      <span className="font-mono text-[1.375rem] font-semibold text-on-surface tracking-wide">
                        {q.operands[1]}
                      </span>
                      <span className="font-mono text-base text-outline">
                        =
                      </span>
                    </div>

                    {/* Answer blank */}
                    <div className="w-[80px] rounded-md py-1 text-center font-mono text-base text-outline border-b-2 border-outline-variant">
                      &nbsp;
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Add/Sub: vertical operand columns ── */
              <div
                className="grid gap-4 sheet-screen-grid"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {questions.map((q, idx) => (
                  <div
                    key={`sheet-q-${q.operands.join('-')}-ans${q.answer}`}
                    className="card p-4 flex flex-col items-center shadow-sm"
                  >
                    {/* Question number */}
                    <span className="label-caps mb-2 self-start text-xs">
                      #{idx + 1}
                    </span>

                    {/* Operands */}
                    <div className="flex flex-col items-end gap-0.5">
                      {q.operands.map((op, opIdx) => {
                        const rowKey = q.operands.slice(0, opIdx + 1).join('-');
                        return (
                          <div key={`sheet-op-${rowKey}`} className="flex items-baseline gap-2">
                            <span className="font-mono text-sm text-on-surface-variant w-4 text-right">
                              {opIdx === 0 ? '' : op < 0 ? '−' : '+'}
                            </span>
                            <span className="font-mono text-2xl font-medium text-on-surface tracking-wide">
                              {Math.abs(op)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div className="w-full my-2 h-[1.5px] bg-on-surface" />

                    {/* Answer area — always blank on screen */}
                    <div className="w-full rounded-md py-1.5 text-center font-mono text-xl font-medium tracking-wide text-outline border border-dashed border-outline-variant bg-transparent">
                      &nbsp;
                    </div>
                  </div>
                ))}
              </div>
            )}

            <SheetAnswerKey
              showAnswers={showAnswers}
              questions={questions}
              answerPages={answerPages}
              pagesLength={pages.length}
              level={level}
            />

            <SheetPrintPages
              pages={pages}
              isMultDiv={isMultDiv}
              questionType={questionType}
              level={level}
              columns={columns}
              showAnswers={showAnswers}
              answerPagesLength={answerPages.length}
            />
          </>
        )}

        {/* Empty state */}
        {questions.length === 0 && (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center bg-surface-container-low border border-dashed border-outline-variant min-h-[200px]">
            <span className="material-symbols-outlined text-[48px] text-outline">
              note_add
            </span>
            <p className="text-on-surface-variant m-0">
              Configure your settings above and click <strong>Generate Sheet</strong> to create a practice sheet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
