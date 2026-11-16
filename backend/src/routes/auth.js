// Shared foundation (Module 1 owner: Muhammad Aamir): login and current-user endpoints.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { config } from '../config.js';
import { validateLogin, validateRegistration } from '../validation.js';

const MAX_REGISTRATIONS = 10;
const REGISTRATION_WINDOW_MS = 10 * 60_000;

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

export function authRoutes(db, { now = () => Date.now(), bcryptRounds = config.bcryptRounds } = {}) {
  const router = Router();
  const throttle = createLoginThrottle(now);
  const registrations = new Map();
  const emailTaken = db.prepare('SELECT 1 FROM users WHERE email = ?');
  const insertPatient = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'patient')");

  // POST /api/auth/register  { name, email, password }  ->  201 { ok, token, user }
  router.post('/register', async (req, res) => {
    // SECURITY: Limit account creation per client address to slow down automated sign-ups.
    const recent = (registrations.get(req.ip) || []).filter(time => now() - time < REGISTRATION_WINDOW_MS);
    if (recent.length >= MAX_REGISTRATIONS) {
      const error = new HttpError(429, 'Too many accounts created from this device. Please try again later.');
      error.retryAfter = Math.ceil((recent[0] + REGISTRATION_WINDOW_MS - now()) / 1000);
      throw error;
    }
    const { ok, errors, values } = validateRegistration(req.body);
    if (!ok) throw new HttpError(400, 'Please check the highlighted fields.', errors);
    if (emailTaken.get(values.email)) {
      throw new HttpError(409, 'An account with this email already exists. Please log in instead.', { email: 'This email is already registered.' });
    }
    // SECURITY: Hash before storing; the plaintext password is never written anywhere.
    // Public sign-up always creates a patient. Doctor accounts are provisioned by the administrator.
    const hash = await bcrypt.hash(values.password, bcryptRounds);
    let id;
    try {
      id = Number(insertPatient.run(values.name, values.email, hash).lastInsertRowid);
    } catch (error) {
      // Two sign-ups racing for the same email: the UNIQUE constraint wins.
      if (/UNIQUE/i.test(String(error?.message))) {
        throw new HttpError(409, 'An account with this email already exists. Please log in instead.', { email: 'This email is already registered.' });
      }
      throw error;
    }
    registrations.set(req.ip, [...recent, now()]);
    const user = { id, name: values.name, role: 'patient' };
    res.status(201).json({ ok: true, token: signToken(user), user, message: 'Account created.' });
  });
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
