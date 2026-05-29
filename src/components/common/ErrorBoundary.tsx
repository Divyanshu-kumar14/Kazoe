import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'var(--font-body)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '56px', color: 'var(--color-status-error)' }}
            role="img"
            aria-hidden="true"
          >
            error
          </span>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginTop: '1rem',
              color: 'var(--color-on-surface)',
              textAlign: 'center',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              color: 'var(--color-on-surface-variant)',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            An unexpected error occurred. You can try again or return to the home page.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.625rem',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
