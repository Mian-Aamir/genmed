import { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { createDemoService } from '../services/demoService';

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

export function AuthProvider({ children }) {
  // SECURITY: Demo only, real authentication (JWT + hashing) will be built in the backend.
  // All submitted values and session state stay in memory; no cookies/storage or sensitive logs.
  const [service] = useState(() => {
    clearSensitiveBrowserStorage();
    return createDemoService();
  });
  const [session, setSession] = useState(() => service.snapshot());
  const [remaining, setRemaining] = useState(0);
  // Activity 5 Task 4: changing this key remounts the whole UI below the provider.
  const [uiSession, setUiSession] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(service.remainingSeconds()), 250);
    return () => window.clearInterval(timer);
  }, [service]);

  function refresh() {
    setSession(service.snapshot());
    setRemaining(service.remainingSeconds());
  }
  function login(email, password) {
    const result = service.login(email, password);
    refresh();
    return result;
  }
  function logout() {
    service.logout();
    // SECURITY: Remove sensitive browser storage and discard ALL temporary UI state of the previous
    // user (form drafts, notes, search filters, open details, selected files, password feedback).
    // Remounting resets every component's state. The cooldown in the service is kept on purpose.
    clearSensitiveBrowserStorage();
    setUiSession(previous => previous + 1);
    refresh();
  }
  function recordFailure() { service.recordFailure(); refresh(); }
  function requestReview(medicineId) {
    const result = service.requestReview(medicineId);
    refresh();
    return result;
  }
  function decideReview(id, status, note) {
    const result = service.decideReview(id, status, note);
    refresh();
    return result;
  }
  return <AuthContext.Provider value={{ ...session, login, logout, remaining, recordFailure,
    isLocked: () => service.remainingSeconds() > 0, requestReview, decideReview }}>
    <Fragment key={uiSession}>{children}</Fragment>
  </AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
