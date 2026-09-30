import { createContext, useContext, useEffect, useRef, useState } from 'react';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // SECURITY: Demo only, real authentication (JWT + hashing) will be built in the backend.
  // SECURITY: Only a display name is kept in memory. No credentials, tokens, or browser storage.
  const [user, setUser] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const attempts = useRef(0);
  const lockedUntil = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((lockedUntil.current - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  function isLocked() { return Date.now() < lockedUntil.current; }
  function recordFailure() {
    if (isLocked()) return;
    // SECURITY: Real rate limiting must be done on the server; this in-memory demo is bypassable.
    // Keeping this in the provider preserves throttling across navigation and form toggles.
    attempts.current += 1;
    if (attempts.current >= 5) {
      lockedUntil.current = Date.now() + 30000;
      attempts.current = 0;
      setRemaining(30);
    }
  }
  function signIn(name) {
    if (isLocked()) return;
    attempts.current = 0;
    setUser({ name: name || 'Patient' });
  }
  function logout() { setUser(null); }
  return <AuthContext.Provider value={{ user, signIn, logout, recordFailure, isLocked, remaining }}>{children}</AuthContext.Provider>;
}
// The context hook intentionally shares this small module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
