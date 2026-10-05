import { createContext, useContext, useEffect, useState } from 'react';
import { createDemoService } from '../services/demoService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // SECURITY: Demo only, real authentication (JWT + hashing) will be built in the backend.
  // All submitted values and session state stay in memory; no cookies/storage or sensitive logs.
  const [service] = useState(() => createDemoService());
  const [session, setSession] = useState(() => service.snapshot());
  const [remaining, setRemaining] = useState(0);
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
  function logout() { service.logout(); refresh(); }
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
    {children}
  </AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
