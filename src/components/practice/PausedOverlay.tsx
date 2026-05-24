import type { ReactElement } from 'react';

interface PausedOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

const PAUSED_CONTAINER: Record<string, string | number> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 64px)',
  padding: '1.5rem 1rem',
  backgroundColor: 'var(--color-surface)',
  gap: '2rem',
};

const PAUSED_TITLE: Record<string, string | number> = {
  fontFamily: 'var(--font-display)',
  fontSize: '3rem',
  fontWeight: 700,
  color: 'var(--color-primary)',
};

const BUTTON_ROW: Record<string, string | number> = {
  display: 'flex',
  gap: '1rem',
};

const ICON_STYLE: Record<string, string | number> = {
  fontSize: '18px',
  verticalAlign: 'middle',
};

export function PausedOverlay({ onResume, onQuit }: PausedOverlayProps): ReactElement {
  return (
    <div style={PAUSED_CONTAINER}>
      <span style={PAUSED_TITLE}>PAUSED</span>
      <div style={BUTTON_ROW}>
        <button type="button" onClick={onResume} className="btn-primary" style={{ fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={ICON_STYLE} role="img" aria-hidden="true">
            play_arrow
          </span>
          Resume
        </button>
        <button type="button" onClick={onQuit} className="btn-secondary" style={{ fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={ICON_STYLE} role="img" aria-hidden="true">
            exit_to_app
          </span>
          Quit
        </button>
      </div>
    </div>
  );
}
