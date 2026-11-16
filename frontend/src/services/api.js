// Activity 6: the single place the frontend talks to the GenMed backend.
// SECURITY: The JWT is passed in by AuthContext from React memory. It is never written to
// localStorage, sessionStorage or cookies (Activity 5 Task 4 still applies).

const API_BASE = '/api';

/**
 * Calls the backend and always resolves to { ok, status, data, message }.
 * Network failures and unexpected responses become a friendly message, never an exception.
 */
export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === 'AbortError') return { ok: false, status: 0, aborted: true, data: null, message: '' };
    return { ok: false, status: 0, data: null, message: 'Cannot reach the GenMed server. Make sure the backend is running.' };
  }

  let data = null;
  try { data = await response.json(); } catch { /* non-JSON response */ }
  const message = typeof data?.message === 'string' ? data.message
    : response.ok ? '' : 'Something went wrong. Please try again.';
  const retryAfter = Number(response.headers.get('retry-after')) || 0;
  return { ok: response.ok && data?.ok !== false, status: response.status, data, message, retryAfter };
}
