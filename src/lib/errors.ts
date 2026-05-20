export function extractError(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null) {
    const msg = (e as Record<string, unknown>).message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
