import { useState, useMemo, useCallback, memo } from 'react';
import { SOROBAN_LEVELS } from '../utils/levelConfig';
import { generateQuestion } from '../utils/questionGenerator';

type QuestionType = 'add_sub' | 'multiplication' | 'division';

function getOpSymbol(type: QuestionType) {
  return type === 'multiplication' ? '×' : type === 'division' ? '÷' : '+';
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'add_sub', label: 'Add / Sub', icon: 'add' },
  { value: 'multiplication', label: 'Multiply', icon: 'close' },
  { value: 'division', label: 'Division', icon: 'percent' },
];

interface SheetQuestion {
  operands: number[];
  answer: number;
  operation: QuestionType;
}

export default memo(function SheetGenerator() {
  const [level, setLevel] = useState(10);
  const [questionCount, setQuestionCount] = useState(20);
  const [columns, setColumns] = useState(4);
  const [rowOverride, setRowOverride] = useState<number | undefined>(undefined);
  const [questionType, setQuestionType] = useState<QuestionType>('add_sub');
  const [questions, setQuestions] = useState<SheetQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);

  const levelConfig = SOROBAN_LEVELS[level];
  const levels = useMemo(
    () => Object.keys(SOROBAN_LEVELS).map(Number).sort((a, b) => b - a),
    []
  );

  const isMultDiv = questionType === 'multiplication' || questionType === 'division';

  const PER_PAGE = isMultDiv ? 10 : 4;
  const ROWS = 2;

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
    const result: { idx: number; answer: number }[][] = [];
    const allAnswers = questions.map((q, i) => ({ idx: i, answer: q.answer }));
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
    setQuestions(qs);
    setShowAnswers(false);
  }, [questionCount, levelConfig, rowOverride, questionType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        
        <div className="sheet-no-print">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Sheet Generator
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.125rem' }}>
            Generate printable practice sheets for offline drills.
          </p>
        </div>

        <div className="sheet-no-print flex flex-col gap-2">
          <span className="label-caps">Question Type</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setQuestionType(opt.value)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all"
                style={{
                  border: questionType === opt.value
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-outline-variant)',
                  backgroundColor: questionType === opt.value
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-container-low)',
                  color: questionType === opt.value
                    ? 'var(--color-on-primary)'
                    : 'var(--color-on-surface)',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{opt.icon}</span>
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
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="question-count-select" className="label-caps">Questions</label>
            <select
              id="question-count-select"
              className="input-field"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
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
                  onChange={(e) => setColumns(Number(e.target.value))}
                >
                  {[2, 3, 4, 5].map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                    setRowOverride(val ? Number(val) : undefined);
                  }}
                >
                  <option value="">Default ({levelConfig.rowCount})</option>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3 sheet-no-print">
          <button onClick={handleGenerate} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
            Generate Sheet
          </button>
          {questions.length > 0 && (
            <>
              <button onClick={() => setShowAnswers(!showAnswers)} className="btn-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {showAnswers ? 'visibility_off' : 'visibility'}
                </span>
                {showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
              </button>
              <button onClick={handlePrint} className="btn-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
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
                    className="card px-5 py-4 flex items-center gap-4"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    {/* Question number */}
                    <span
                      className="label-caps"
                      style={{
                        fontSize: '0.75rem',
                        minWidth: '2rem',
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      #{idx + 1}
                    </span>

                    {/* Expression */}
                    <div className="flex items-baseline gap-2 flex-1">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.375rem',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {q.operands[0]}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: 'var(--color-primary)',
                        }}
                      >
                        {getOpSymbol(q.operation)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.375rem',
                          fontWeight: 600,
                          color: 'var(--color-on-surface)',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {q.operands[1]}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1rem',
                          color: 'var(--color-outline)',
                        }}
                      >
                        =
                      </span>
                    </div>

                    {/* Answer blank */}
                    <div
                      className="rounded-md py-1 text-center"
                      style={{
                        width: '80px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1rem',
                        color: 'var(--color-outline)',
                        borderBottom: '2px solid var(--color-outline-variant)',
                      }}
                    >
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
                    className="card p-4 flex flex-col items-center"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    {/* Question number */}
                    <span className="label-caps mb-2" style={{ alignSelf: 'start', fontSize: '0.75rem' }}>
                      #{idx + 1}
                    </span>

                    {/* Operands */}
                    <div className="flex flex-col items-end gap-0.5">
                      {q.operands.map((op, i) => (
                        <div key={i} className="flex items-baseline gap-2">
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.875rem',
                              color: 'var(--color-on-surface-variant)',
                              width: '1rem',
                              textAlign: 'right',
                            }}
                          >
                            {i === 0 ? '' : op < 0 ? '−' : '+'}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '1.5rem',
                              fontWeight: 500,
                              color: 'var(--color-on-surface)',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {Math.abs(op)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div
                      className="w-full my-2"
                      style={{ height: '1.5px', backgroundColor: 'var(--color-on-surface)' }}
                    />

                    {/* Answer area — always blank on screen */}
                    <div
                      className="w-full rounded-md py-1.5 text-center"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        color: 'var(--color-outline)',
                        border: '1px dashed var(--color-outline-variant)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      &nbsp;
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAnswers && (
              <div className="sheet-no-print flex flex-col gap-4">
                <div
                  className="flex items-center gap-3"
                  style={{ padding: '0 0.25rem' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '24px', color: 'var(--color-primary)' }}
                  >
                    key
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.375rem',
                      fontWeight: 600,
                      color: 'var(--color-on-surface)',
                      margin: 0,
                    }}
                  >
                    Answer Key
                  </h2>
                </div>

                <div className="card overflow-x-auto">
                  <div style={{ minWidth: '600px', display: 'flex', flexDirection: 'column' }}>
                    {/* Table header */}
                    <div
                      style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      backgroundColor: 'var(--color-surface-container)',
                    }}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2.5rem 1fr',
                          padding: '0.625rem 1rem',
                          borderRight: i < 4 ? '1px solid var(--color-outline-variant)' : 'none',
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--color-on-surface-variant)',
                        }}>
                          #
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--color-on-surface-variant)',
                          textAlign: 'right',
                        }}>
                          Ans
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Table rows — chunk into groups of 5 for table layout */}
                  <div>
                    {Array.from({ length: Math.ceil(questions.length / 5) }).map((_, rowIdx) => (
                      <div
                        key={rowIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          borderBottom: rowIdx < Math.ceil(questions.length / 5) - 1
                            ? '1px solid var(--color-outline-variant)'
                            : 'none',
                        }}
                      >
                        {Array.from({ length: 5 }).map((_, colIdx) => {
                          const qIdx = rowIdx * 5 + colIdx;
                          if (qIdx >= questions.length) {
                            return (
                          <div
                            key={`empty-${colIdx}-${rowIdx}`}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRight: colIdx < 4 ? '1px solid var(--color-outline-variant)' : 'none',
                            }}
                          />
                            );
                          }
                        return (
                          <div
                            key={`cell-${colIdx}-${qIdx}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2.5rem 1fr',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                borderRight: colIdx < 4 ? '1px solid var(--color-outline-variant)' : 'none',
                                backgroundColor: rowIdx % 2 === 0
                                  ? 'transparent'
                                  : 'var(--color-surface-container-low)',
                              }}
                            >
                              <span style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-on-surface-variant)',
                              }}>
                                Q{qIdx + 1}
                              </span>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1.0625rem',
                                fontWeight: 600,
                                color: 'var(--color-primary)',
                                textAlign: 'right',
                              }}>
                                {questions[qIdx].answer}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="sheet-print-pages">
              {pages.map((pageQuestions, pageIdx) => (
                <div key={pageIdx} className="sheet-page">
                  <div className="sheet-page-header">
                    <div className="sheet-page-title">
                      {isMultDiv
                        ? `${questionType === 'multiplication' ? 'Multiplication' : 'Division'} Practice Sheet`
                        : 'Abacus Practice Sheet'}
                    </div>
                    <div className="sheet-page-meta">
                      <span>Level {level}</span>
                      <span className="sheet-page-fields">
                        Name: __________________ &nbsp;&nbsp;&nbsp; Date: __________
                      </span>
                    </div>
                  </div>

                  {isMultDiv ? (
                    /* ── Mult/Div print: list of horizontal expressions ── */
                    <div
                      style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0',
                        padding: '8mm 4mm',
                      }}
                    >
                      {pageQuestions.map((q, qIdx) => {
                        const globalIdx = pageIdx * (isMultDiv ? 10 : 4) + qIdx;
                        return (
                          <div
                            key={qIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3mm',
                              padding: '5mm 6mm',
                              borderBottom: '0.5pt solid #ddd',
                            }}
                          >
                            {/* Q number */}
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '10pt',
                                fontWeight: 600,
                                color: '#888',
                                minWidth: '24pt',
                              }}
                            >
                              Q{globalIdx + 1}.
                            </span>

                            {/* Expression */}
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '14pt',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                              }}
                            >
                              {q.operands[0]}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '12pt',
                                fontWeight: 500,
                                color: '#555',
                              }}
                            >
                              {getOpSymbol(q.operation)}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '14pt',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                              }}
                            >
                              {q.operands[1]}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '12pt',
                                color: '#888',
                              }}
                            >
                              =
                            </span>

                            {/* Answer line */}
                            <div
                              style={{
                                flex: 1,
                                borderBottom: '1.5pt solid #ccc',
                                minWidth: '40pt',
                                height: '16pt',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Add/Sub print: 2×2 question grid ── */
                    <div
                      className="sheet-page-grid"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                      }}
                    >
                      {pageQuestions.map((q, qIdx) => {
                        const globalIdx = pageIdx * PER_PAGE + qIdx;
                        return (
                          <div key={qIdx} className="sheet-question-cell">
                            <div className="sheet-q-number">Q{globalIdx + 1}</div>
                            <div className="sheet-operands">
                              {q.operands.map((op, i) => (
                                <div key={i} className="sheet-operand-row">
                                  <span className="sheet-op-sign">
                                    {i === 0 ? '' : op < 0 ? '−' : '+'}
                                  </span>
                                  <span className="sheet-op-value">
                                    {Math.abs(op)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="sheet-divider" />
                            <div className="sheet-answer-blank" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Page footer */}
                  <div className="sheet-page-footer">
                    <span>kazoe.app</span>
                    <span>Page {pageIdx + 1} of {pages.length + (showAnswers ? answerPages.length : 0)}</span>
                  </div>
                </div>
              ))}

              {/* ANSWER KEY PAGES — at the very end */}
              {showAnswers && answerPages.map((pageAnswers, apIdx) => (
                <div key={`ans-${apIdx}`} className="sheet-page">
                  <div className="sheet-page-header">
                    <div className="sheet-page-title">Answer Key</div>
                    <div className="sheet-page-meta">
                      <span>Level {level}</span>
                      {answerPages.length > 1 && (
                        <span>Sheet {apIdx + 1} of {answerPages.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="sheet-answer-key-grid">
                    {pageAnswers.map(({ idx, answer }) => (
                      <div key={idx} className="sheet-answer-entry">
                        <span className="sheet-answer-label">Q{idx + 1}</span>
                        <span className="sheet-answer-value">{answer}</span>
                      </div>
                    ))}
                  </div>

                  <div className="sheet-page-footer">
                    <span>kazoe.app</span>
                    <span>Page {pages.length + apIdx + 1} of {pages.length + answerPages.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {questions.length === 0 && (
          <div
            className="card p-12 flex flex-col items-center justify-center gap-4 text-center"
            style={{
              backgroundColor: 'var(--color-surface-container-low)',
              border: '1px dashed var(--color-outline-variant)',
              minHeight: '200px',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '48px',
                color: 'var(--color-outline)',
              }}
            >
              note_add
            </span>
            <p style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Configure your settings above and click <strong>Generate Sheet</strong> to create a practice sheet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
