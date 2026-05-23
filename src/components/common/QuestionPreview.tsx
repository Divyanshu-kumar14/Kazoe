import { type QuestionType } from './configOptions';

interface OperandDisplay {
  sign: string;
  value: number;
}

interface QuestionPreviewProps {
  questionType: QuestionType;
  sampleOperands: OperandDisplay[];
}

export function QuestionPreview({ questionType, sampleOperands }: QuestionPreviewProps) {
  return (
    <div
      className="w-full rounded-lg p-6 sm:p-8 flex flex-col items-center"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        border: '1px solid var(--color-outline-variant)',
      }}
    >
      {questionType === 'multiplication' || questionType === 'division' ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-on-surface)', letterSpacing: '0.04em' }}>
              {sampleOperands[0]?.value ?? '97'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-primary)' }}>
              {questionType === 'multiplication' ? '×' : '÷'}
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
            style={{
              width: '120px',
              border: '1px dashed var(--color-outline-variant)',
              borderBottom: '3px solid var(--color-outline-variant)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-outline)',
              fontSize: '0.875rem',
              borderRadius: '0.5rem 0.5rem 0 0',
            }}
          >
            ?
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-end gap-2">
            {sampleOperands.map((op, idx) => (
              <div key={`preview-${op.sign}-${op.value}-${idx}`} className="flex items-baseline gap-4">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--color-on-surface-variant)', width: '1.5rem', textAlign: 'right' }}>
                  {op.sign}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 500, color: 'var(--color-on-surface)', letterSpacing: '0.05em' }}>
                  {op.value}
                </span>
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
  );
}
