export function PausedScreen({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-6 bg-surface gap-8">
      <span className="font-display text-5xl font-bold text-primary">
        PAUSED
      </span>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onResume}
          className="btn-primary font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">
            play_arrow
          </span>
          Resume
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="btn-secondary font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">
            exit_to_app
          </span>
          Quit
        </button>
      </div>
    </div>
  );
}
