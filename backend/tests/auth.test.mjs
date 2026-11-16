// Activity 6 Task 4 and Task 6 (1)-(3): login, JWT generation and token verification.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { DOCTOR, PATIENT, startServer } from './helpers.mjs';

let api;
before(async () => { api = await startServer(); });
after(() => api.close());

test('health check confirms the database connection', async () => {
  const res = await api.call('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { ok: true, service: 'genmed-api', database: 'connected' });
});

test('passwords are stored as bcrypt hashes, never plaintext', () => {
  const rows = api.db.prepare('SELECT email, password_hash FROM users').all();
  assert.ok(rows.length >= 3);
  for (const row of rows) {
    assert.match(row.password_hash, /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    assert.ok(!row.password_hash.includes('Demo'));
  }
});

test('successful login returns a signed HS256 JWT with only id and role', async () => {
  const res = await api.call('POST', '/api/auth/login', { body: { email: '  Patient@Example.com ', password: PATIENT.password } });
  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
  assert.deepEqual(Object.keys(res.data.user).sort(), ['id', 'name', 'role']);
  assert.equal(res.data.user.role, 'patient');
  const decoded = jwt.decode(res.data.token, { complete: true });
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.role, 'patient');
  assert.equal(decoded.payload.sub, String(res.data.user.id));
  assert.ok(decoded.payload.exp > decoded.payload.iat);
  assert.equal(JSON.stringify(decoded.payload).includes('PatientDemo1!'), false);
  assert.equal(JSON.stringify(decoded.payload).includes('@'), false);
});

test('wrong password and unknown email get the same generic 401', async () => {
  const wrong = await api.call('POST', '/api/auth/login', { body: { email: DOCTOR.email, password: 'nope' } });
  const unknown = await api.call('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: 'nope' } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.data, unknown.data);
  assert.equal(wrong.data.message, 'Invalid email or password.');
});

test('SQL injection in the login form does not bypass authentication', async () => {
  for (const email of ["' OR '1'='1' --", "patient@example.com' --", "x@x.com' OR 1=1; DROP TABLE users; --"]) {
    const res = await api.call('POST', '/api/auth/login', { body: { email, password: "' OR '1'='1" } });
    assert.equal(res.status, 401);
  }
  assert.ok(api.db.prepare('SELECT COUNT(*) AS n FROM users').get().n >= 3, 'users table still exists');
});

test('protected endpoint works with a valid token', async () => {
  const token = await api.login(DOCTOR);
  const res = await api.call('GET', '/api/auth/me', { token });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.role, 'doctor');
});

test('missing, malformed, tampered, re-signed, alg:none and expired tokens are rejected', async () => {
  const token = await api.login(PATIENT);
  const [header, payload, signature] = token.split('.');
  const elevated = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), role: 'doctor' })).toString('base64url');
  const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const cases = {
    missing: undefined,
    malformed: 'not-a-jwt',
    tamperedPayload: `${header}.${elevated}.${signature}`,
    tamperedSignature: `${header}.${payload}.${signature.slice(0, -2)}xx`,
    wrongSecret: jwt.sign({ role: 'doctor' }, 'attacker-secret-attacker-secret-attacker', { subject: '3', issuer: 'genmed-api', audience: 'genmed-web' }),
    algNone: `${noneHeader}.${elevated}.`,
  };
  for (const [name, value] of Object.entries(cases)) {
    const res = await api.call('GET', '/api/reviews', { token: value });
    assert.equal(res.status, 401, name);
    assert.equal(res.data.ok, false, name);
  }
  const noBearer = await api.call('GET', '/api/reviews', { headers: { Authorization: token } });
  assert.equal(noBearer.status, 401);
});

test('an expired token is rejected', async () => {
  const decoded = jwt.decode(await api.login(PATIENT));
  const { config } = await import('../src/config.js');
  const expired = jwt.sign({ role: 'patient', exp: Math.floor(Date.now() / 1000) - 60 }, config.jwtSecret, {
    algorithm: 'HS256', subject: decoded.sub, issuer: config.jwtIssuer, audience: config.jwtAudience,
  });
  const res = await api.call('GET', '/api/auth/me', { token: expired });
  assert.equal(res.status, 401);
});

test('five failed logins lock that email for 30 seconds with 429', async () => {
  let clock = Date.now();
  const local = await startServer({ now: () => clock });
  try {
    for (let i = 0; i < 5; i += 1) {
      assert.equal((await local.call('POST', '/api/auth/login', { body: { ...PATIENT, password: 'wrong' } })).status, 401);
    }
    const locked = await local.call('POST', '/api/auth/login', { body: PATIENT });
    assert.equal(locked.status, 429);
    assert.equal(locked.headers.get('retry-after'), '30');
    clock += 31_000;
    assert.equal((await local.call('POST', '/api/auth/login', { body: PATIENT })).status, 200);
  } finally {
    await local.close();
  }
});

test('errors never leak stack traces or SQL details', async () => {
  const badJson = await api.call('POST', '/api/auth/login', { body: '{"email":' });
  assert.equal(badJson.status, 400);
  assert.deepEqual(badJson.data, { ok: false, message: 'Invalid request body.' });
  const missing = await api.call('GET', '/api/does-not-exist');
  assert.equal(missing.status, 404);
  for (const res of [badJson, missing]) {
    const text = JSON.stringify(res.data);
    assert.doesNotMatch(text, /at .*\.js|SQLITE|stack|node_modules/i);
  }
  assert.equal(missing.headers.get('x-powered-by'), null);
});
