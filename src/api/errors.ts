export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** One place that turns any error into text a user can act on. */
export function userMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
  const ref = err.requestId ? ` (reference: ${err.requestId})` : '';
  switch (err.code) {
    case 'network_error': return "Can't reach the server. Check your connection and try again.";
    case 'timeout': return 'The server took too long to respond. Try again.';
    case 'invalid_credentials': return 'Email or password is incorrect.';
    case 'account_locked': return 'Too many failed attempts. Wait 15 minutes and try again.';
    case 'rate_limited': return 'Too many requests. Wait a moment and try again.';
    case 'maintenance': return 'The service is under maintenance. Please try again shortly.';
    case 'validation_error': {
      const first = Array.isArray(err.details) ? (err.details[0] as { message?: string } | undefined)?.message : undefined;
      return first ?? 'Some fields are invalid. Check them and try again.';
    }
  }
  if (err.status === 401) return 'Your session has expired. Sign in again.';
  if (err.status === 403) return "You don't have access to this.";
  if (err.status === 404) return 'We could not find what you asked for.';
  if (err.status >= 500) return `Something went wrong on our side${ref}. Try again, and share the reference if it keeps happening.`;
  return err.message;
}
