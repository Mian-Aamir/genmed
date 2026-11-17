import { createContext, Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

// Activity 5 Task 4: keys that look like credentials, sessions or GenMed data.
const SENSITIVE_KEY = /pass(word)?|pwd|token|secret|session|auth|credential|api[-_]?key|private|genmed/i;

function clearSensitiveBrowserStorage() {
  // SECURITY: GenMed never writes passwords, tokens or sessions to browser storage. This removes
  // anything sensitive left by an older build, a test or an extension. sessionStorage is
  // tab-scoped temporary state, so all of it is cleared. Storage access can throw (blocked
  // site data, privacy mode), and that must never break logout.
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (SENSITIVE_KEY.test(key)) window.localStorage.removeItem(key);
    }
  } catch { /* storage unavailable: nothing to clear */ }
  try {
    window.sessionStorage.clear();
  } catch { /* storage unavailable: nothing to clear */ }
}

const emptySession = { user: null, requests: [] };

export function AuthProvider({ children }) {
  // Activity 6: authentication is done by the backend (bcrypt + signed JWT).
  // SECURITY: The JWT lives only in React memory (this ref). It is not stored in localStorage,
  // sessionStorage or cookies, so a page refresh logs the user out.
  const token = useRef(null);
  const [session, setSession] = useState(emptySession);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  // Activity 5 Task 4: changing this key remounts the whole UI below the provider.
  const [uiSession, setUiSession] = useState(0);

  useEffect(() => { clearSensitiveBrowserStorage(); }, []);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const endSession = useCallback(() => {
    token.current = null;
    // SECURITY: Remove sensitive browser storage and discard ALL temporary UI state of the previous
    // user (form drafts, notes, search filters, open details, selected files, password feedback).
    clearSensitiveBrowserStorage();
    setSession(emptySession);
    setUiSession(previous => previous + 1);
  }, []);

  /** Authenticated API call. A 401 means the token is missing, invalid or expired: log out. */
  const api = useCallback(async (path, options = {}) => {
    const result = await apiRequest(path, { ...options, token: token.current });
    if (result.status === 401 && token.current) endSession();
    return result;
  }, [endSession]);

  // Module 1: the patient/doctor review queue shown on the dashboards.
  const loadReviews = useCallback(async () => {
    const result = await api('/reviews');
    if (result.ok) setSession(previous => (previous.user ? { ...previous, requests: result.data.requests } : previous));
    return result;
  }, [api]);

  function startSession(data) {
    token.current = data.token;
    setSession({ user: data.user, requests: [] });
    loadReviews();
  }

  async function login(email, password) {
    if (token.current) return { ok: false, message: 'Log out before switching accounts.' };
    const result = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    if (result.status === 429) setLockedUntil(Date.now() + (result.retryAfter || 30) * 1000);
    if (!result.ok) return { ok: false, message: result.message || 'Invalid email or password.' };
    startSession(result.data);
    return { ok: true };
  }

  // POST /api/auth/register: creates a patient account and signs the new user in.
  async function register(name, email, password) {
    if (token.current) return { ok: false, message: 'Log out before creating another account.' };
    const result = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
    if (!result.ok) return { ok: false, message: result.message, errors: result.data?.errors };
    startSession(result.data);
    return { ok: true };
  }

  function logout() {
    // Stateless JWT: discarding it on the client ends the session. It also expires after 1 hour.
    endSession();
  }

  async function requestReview(medicineId) {
    const result = await api('/reviews', { method: 'POST', body: { medicineId } });
    if (result.ok) await loadReviews();
    return { ok: result.ok, message: result.message };
  }

  async function decideReview(id, decision, note) {
    const result = await api(`/reviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: { decision, note } });
    if (result.ok) await loadReviews();
    return { ok: result.ok, message: result.message, errors: result.data?.errors };
  }

  return <AuthContext.Provider value={{ ...session, login, register, logout, remaining, isLocked: () => remaining > 0,
    api, loadReviews, requestReview, decideReview }}>
    <Fragment key={uiSession}>{children}</Fragment>
  </AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
