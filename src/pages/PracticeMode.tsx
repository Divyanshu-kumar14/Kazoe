import { ConfigPanel } from '../components/practice/ConfigPanel';

export default function PracticeMode() {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            Set Up Your Practice
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.125rem' }}>
            Choose your level and settings, then jump in.
          </p>
        </div>
        <ConfigPanel />
      </div>
    </div>
  );
}
