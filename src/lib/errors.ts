export function extractError(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null) {
    const err = e as Record<string, unknown>;
    const msg = err.message;
    if (typeof msg === 'string' && msg.length > 0) {
      const cause = err.cause;
      if (cause && typeof cause === 'object') {
        const causeMsg = (cause as Record<string, unknown>).message;
        if (typeof causeMsg === 'string' && causeMsg.length > 0) {
          return `${msg}: ${causeMsg}`;
        }
      }
      return msg;
    }
    const code = err.code;
    if (typeof code === 'string') return code;
  }
  if (e instanceof Error) {
    const cause = e.cause;
    if (cause instanceof Error) {
      return `${e.message}: ${extractError(cause, '')}`;
    }
    return e.message;
  }
  return fallback;
}
