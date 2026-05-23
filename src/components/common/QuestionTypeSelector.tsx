import { QUESTION_TYPE_OPTIONS, type QuestionType } from './configOptions';

interface QuestionTypeSelectorProps {
  questionType: QuestionType;
  onQuestionTypeChange: (questionType: QuestionType) => void;
}

export function QuestionTypeSelector({ questionType, onQuestionTypeChange }: QuestionTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="label-caps">Question Type</span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUESTION_TYPE_OPTIONS.map((opt) => (
          <button type="button"
            key={opt.value}
            onClick={() => onQuestionTypeChange(opt.value)}
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
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }} role="img" aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
