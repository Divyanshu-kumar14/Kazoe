type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

const MAX_RECENT_ERRORS = 50;
const ERROR_LOG_KEY = 'kazoe-error-log';

class Telemetry {
  private recentErrors: LogEvent[] = [];

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const event: LogEvent = { level, message, context, timestamp: Date.now() };

    if (import.meta.env.DEV) {
      const fn =
        level === 'error' ? console.error
        : level === 'warn'  ? console.warn
        : console.log;
      fn(`[Kazoe] ${message}`, context ?? '');
    }

    // Persist errors for post-mortem debugging
    if (level === 'error') {
      this.recentErrors.push(event);
      if (this.recentErrors.length > MAX_RECENT_ERRORS) {
        this.recentErrors.shift();
      }
      this.persistErrors();
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, errorStack: error.stack?.split('\n').slice(0, 5).join('\n') }
        : error !== undefined
          ? { error }
          : {}),
    });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      this.log('debug', message, context);
    }
  }

  /** Return all recent errors (useful for bug-report export). */
  getRecentErrors(): LogEvent[] {
    return [...this.recentErrors];
  }

  /** Restore persisted errors from a previous session (e.g., after crash + reload). */
  restoreErrors(): void {
    try {
      const raw = localStorage.getItem(ERROR_LOG_KEY);
      if (raw) {
        this.recentErrors = JSON.parse(raw) as LogEvent[];
      }
    } catch {
      // Corrupted data — silently reset
    }
  }

  private persistErrors(): void {
    try {
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this.recentErrors));
    } catch {
      // Storage full — silently drop
    }
  }
}

export const telemetry = new Telemetry();
