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
            Session Configuration
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.125rem' }}>
            Calibrate your dojo. Set the parameters for your next mental arithmetic drill.
          </p>
        </div>
        <ConfigPanel />
      </div>
    </div>
  );
}
