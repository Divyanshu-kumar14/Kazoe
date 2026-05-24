import { type SheetQuestion, type QuestionType, getOpSymbol } from './types';

interface SheetPrintPagesProps {
  pages: SheetQuestion[][];
  isMultDiv: boolean;
  questionType: QuestionType;
  level: number;
  columns: number;
  showAnswers: boolean;
  answerPagesLength: number;
}

export function SheetPrintPages({
  pages,
  isMultDiv,
  questionType,
  level,
  columns,
  showAnswers,
  answerPagesLength,
}: SheetPrintPagesProps) {
  const ROWS = 2;
  const PER_PAGE = isMultDiv ? 10 : 4;

  return (
    <div className="sheet-print-pages">
      {pages.map((pageQuestions, pageIdx) => (
        <div key={`page-${pageQuestions[0]?.operands.join('-')}-${pageIdx}`} className="sheet-page">
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
                    key={`q-${globalIdx}`}
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
                  <div key={`q-${globalIdx}`} className="sheet-question-cell">
                    <div className="sheet-q-number">Q{globalIdx + 1}</div>
                    <div className="sheet-operands">
                      {q.operands.map((op, i) => {
                        const opKey = `op-${globalIdx}-${i}-${op}`;
                        return (
                          <div key={opKey} className="sheet-operand-row">
                            <span className="sheet-op-sign">
                              {i === 0 ? '' : op < 0 ? '−' : '+'}
                            </span>
                            <span className="sheet-op-value">
                              {Math.abs(op)}
                            </span>
                          </div>
                        );
                      })}
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
            <span>
              Page {pageIdx + 1} of {pages.length + (showAnswers ? answerPagesLength : 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
