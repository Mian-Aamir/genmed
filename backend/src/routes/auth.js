// Shared foundation (Module 1 owner: Muhammad Aamir): login and current-user endpoints.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { validateLogin } from '../validation.js';

const MAX_FAILURES = 5;
const LOCK_MS = 30_000;

// SECURITY: Basic in-memory login throttling per email + client address. A production system
// would use a shared store (e.g. Redis) and also throttle per account across addresses.
function createLoginThrottle(now = () => Date.now()) {
  const attempts = new Map();
  return {
    retryAfter(key) {
      const entry = attempts.get(key);
      if (!entry?.lockedUntil) return 0;
      const ms = entry.lockedUntil - now();
      if (ms <= 0) { attempts.delete(key); return 0; }
      return Math.ceil(ms / 1000);
    },
    fail(key) {
      const entry = attempts.get(key) || { failures: 0, lockedUntil: 0 };
      entry.failures += 1;
      if (entry.failures >= MAX_FAILURES) { entry.failures = 0; entry.lockedUntil = now() + LOCK_MS; }
      attempts.set(key, entry);
    },
    reset(key) { attempts.delete(key); },
  };
}

export function authRoutes(db, { now } = {}) {
  const router = Router();
  const throttle = createLoginThrottle(now);
  // SECURITY: Parameterized query; the email is bound as data, never concatenated into SQL.
  const findByEmail = db.prepare('SELECT id, name, role, password_hash FROM users WHERE email = ?');
  // Compared against when the email is unknown so both paths take similar time.
  const dummyHash = bcrypt.hashSync('genmed-timing-equaliser', 10);

  // POST /api/auth/login  { email, password }  ->  { ok, token, user }
  router.post('/login', async (req, res) => {
    const { ok, values } = validateLogin(req.body);
    const key = `${values.email}|${req.ip}`;
    const wait = throttle.retryAfter(key);
    if (wait) {
      const error = new HttpError(429, `Too many attempts. Try again in ${wait} seconds.`);
      error.retryAfter = wait;
      throw error;
    }
    const account = ok ? findByEmail.get(values.email) : undefined;
    const valid = await bcrypt.compare(ok ? values.password : '', account?.password_hash ?? dummyHash);
    if (!ok || !account || !valid) {
      throttle.fail(key);
      // SECURITY: One generic message for unknown emails, wrong passwords and bad input.
      throw new HttpError(401, 'Invalid email or password.');
    }
    throttle.reset(key);
    res.json({
      ok: true,
      token: signToken(account),
      user: { id: account.id, name: account.name, role: account.role },
    });
  });

  // GET /api/auth/me  (protected)  ->  the user behind the token
  router.get('/me', requireAuth(db), (req, res) => {
    const { id, name, role } = req.user;
    res.json({ ok: true, user: { id, name, role } });
  });

  return router;
}
