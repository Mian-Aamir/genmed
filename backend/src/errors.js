/** An error whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(_req, _res, next) {
  next(new HttpError(404, 'Not found.'));
}

// SECURITY (Activity 6 Task 5): Never send stack traces, SQL text, file paths or library errors
// to the client. Unexpected errors get one generic message; details stay in the server log.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    const body = { ok: false, message: error.message };
    if (error.details) body.errors = error.details;
    if (error.retryAfter) res.set('Retry-After', String(error.retryAfter));
    return res.status(error.status).json(body);
  }
  // Malformed JSON or an oversized body from express.json().
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ ok: false, message: 'Invalid request body.' });
  if (error?.type === 'entity.too.large') return res.status(413).json({ ok: false, message: 'Request body is too large.' });

  console.error('[genmed-api] Unexpected error:', error);
  return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again later.' });
}
