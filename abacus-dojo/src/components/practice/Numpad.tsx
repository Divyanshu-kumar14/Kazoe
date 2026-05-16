interface Props {
  onInput: (val: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onSkip: () => void;
  canSubmit: boolean;
}

export function Numpad({ onInput, onDelete, onSubmit, onSkip, canSubmit }: Props) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const keyStyle: React.CSSProperties = {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-surface-lowest)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '0.5rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '1.25rem',
    fontWeight: 500,
    color: 'var(--color-on-surface)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    userSelect: 'none' as const,
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[300px] mx-auto mt-4" style={{ userSelect: 'none' }}>
      {digits.map((d) => (
        <button
          key={d}
          onClick={() => onInput(d.toString())}
          style={keyStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-lowest)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
          }}
        >
          {d}
        </button>
      ))}

      {/* − key */}
      <button onClick={() => onInput('-')} style={{ ...keyStyle, fontSize: '1.5rem' }}>
        −
      </button>

      {/* 0 key */}
      <button onClick={() => onInput('0')} style={keyStyle}>
        0
      </button>

      {/* Delete key */}
      <button
        onClick={onDelete}
        style={keyStyle}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>backspace</span>
      </button>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="col-span-1 mt-2"
        style={{
          ...keyStyle,
          backgroundColor: 'var(--color-secondary-container)',
          color: 'var(--color-on-secondary-container)',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '0.875rem',
        }}
      >
        Skip
      </button>

      {/* Enter */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="col-span-2 mt-2"
        style={{
          ...keyStyle,
          backgroundColor: canSubmit ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
          color: canSubmit ? 'var(--color-on-primary)' : 'var(--color-outline)',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          opacity: canSubmit ? 1 : 0.5,
          boxShadow: canSubmit ? '0 2px 8px rgba(0,89,92,0.2)' : 'none',
        }}
      >
        Enter
      </button>
    </div>
  );
}
