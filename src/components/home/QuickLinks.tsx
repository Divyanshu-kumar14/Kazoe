import { Link } from 'react-router-dom';

export function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link
        to="/sheets"
        className="card card-interactive p-6 flex flex-col gap-3 no-underline"
        style={{ color: 'inherit' }}
        aria-label="Open Sheet Generator — create custom practice sheets"
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: 'var(--color-primary)' }} role="img" aria-hidden="true"
            >
              description
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Sheet Generator
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Create custom practice sheets tailored to your current level. Print or practice online.
        </p>
        <span
          className="mt-auto flex items-center gap-1 text-sm font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          Generate
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }} role="img" aria-hidden="true">arrow_forward</span>
        </span>
      </Link>

      <Link
        to="/levels"
        className="card card-interactive p-6 flex flex-col gap-3 no-underline"
        style={{ color: 'inherit' }}
        aria-label="View Level Guide — review curriculum and mastery progress"
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', color: 'var(--color-primary)' }} role="img" aria-hidden="true"
            >
              school
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Level Guide
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Review the curriculum, see what's next, and track your overall mastery progress.
        </p>
        <span
          className="mt-auto flex items-center gap-1 text-sm font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          View Path
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }} role="img" aria-hidden="true">arrow_forward</span>
        </span>
      </Link>
    </div>
  );
}
