import { type SheetQuestion } from './types';

interface SheetAnswerKeyProps {
  showAnswers: boolean;
  questions: SheetQuestion[];
  answerPages: { qId: number; answer: number }[][];
  pagesLength: number;
  level: number;
}

export function SheetAnswerKey({
  showAnswers,
  questions,
  answerPages,
  pagesLength,
  level,
}: SheetAnswerKeyProps) {
  if (!showAnswers) return null;

  return (
    <>
      <div className="sheet-no-print flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <span className="material-symbols-outlined text-[24px] text-primary" role="img" aria-hidden="true">
            key
          </span>
          <h2 className="font-display text-[1.375rem] font-semibold text-on-surface m-0">
            Answer Key
          </h2>
        </div>

        <div className="card overflow-x-auto">
          <div className="min-w-[600px] flex flex-col">
            {/* Table header */}
            <div className="grid grid-cols-5 border-b border-outline-variant bg-surface-container">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`header-col-${i}`}
                  className={`grid grid-cols-[2.5rem_1fr] px-4 py-2.5 ${
                    i < 4 ? 'border-r border-outline-variant' : ''
                  }`}
                >
                  <span className="font-body text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
                    #
                  </span>
                  <span className="font-body text-xs font-semibold tracking-wider uppercase text-on-surface-variant text-right">
                    Ans
                  </span>
                </div>
              ))}
            </div>

            {/* Table rows */}
            <div>
              {Array.from({ length: Math.ceil(questions.length / 5) }).map((_, rowIdx) => (
                <div
                  key={`ans-row-${rowIdx}`}
                  className={`grid grid-cols-5 ${
                    rowIdx < Math.ceil(questions.length / 5) - 1 ? 'border-b border-outline-variant' : ''
                  }`}
                >
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    const qIdx = rowIdx * 5 + colIdx;
                    if (qIdx >= questions.length) {
                      return (
                        <div
                          key={`empty-${colIdx}-${rowIdx}`}
                          className={`px-4 py-3 ${
                            colIdx < 4 ? 'border-r border-outline-variant' : ''
                          }`}
                        />
                      );
                    }
                    return (
                      <div
                        key={`cell-${colIdx}-${qIdx}`}
                        className={`grid grid-cols-[2.5rem_1fr] items-center px-4 py-3 ${
                          colIdx < 4 ? 'border-r border-outline-variant' : ''
                        } ${
                          rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-surface-container-low'
                        }`}
                      >
                        <span className="font-body text-xs font-semibold text-on-surface-variant">
                          Q{qIdx + 1}
                        </span>
                        <span className="font-mono text-[1.0625rem] font-semibold text-primary text-right">
                          {questions[qIdx]!.answer}
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

      {/* ANSWER KEY PAGES — at the very end for printing */}
      <div className="sheet-print-pages">
        {answerPages.map((pageAnswers, apIdx) => (
          <div key={`ans-${questions[apIdx * 20]?.answer ?? apIdx}`} className="sheet-page">
            <div className="sheet-page-header">
              <div className="sheet-page-title">Answer Key</div>
              <div className="sheet-page-meta">
                <span>Level {level}</span>
                {answerPages.length > 1 && (
                  <span>
                    Sheet {apIdx + 1} of {answerPages.length}
                  </span>
                )}
              </div>
            </div>

            <div className="sheet-answer-key-grid">
              {pageAnswers.map(({ qId, answer }) => (
                <div key={`ans-page-${apIdx}-q-${qId}`} className="sheet-answer-entry">
                  <span className="sheet-answer-label">Q{qId + 1}</span>
                  <span className="sheet-answer-value">{answer}</span>
                </div>
              ))}
            </div>

            <div className="sheet-page-footer">
              <span>kazoe.app</span>
              <span>
                Page {pagesLength + apIdx + 1} of {pagesLength + answerPages.length}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
