// Registration: anyone can create a patient account and log in with it.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startServer } from './helpers.mjs';

let api;
before(async () => { api = await startServer({ sampleData: false }); });
after(() => api.close());

const newUser = { name: '  Hamza   Tariq ', email: ' Hamza.Tariq@Example.com ', password: 'Hamza2026Secure' };

test('a fresh database has no accounts or sample records, only the medicine catalogue', () => {
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM medicine_requests').get().n, 0);
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM review_requests').get().n, 0);
  assert.ok(api.db.prepare('SELECT COUNT(*) AS n FROM medicines').get().n > 0);
});

test('register creates a patient with a bcrypt hash and logs them in', async () => {
  const res = await api.call('POST', '/api/auth/register', { body: newUser });
  assert.equal(res.status, 201);
  assert.deepEqual({ name: res.data.user.name, role: res.data.user.role }, { name: 'Hamza Tariq', role: 'patient' });
  assert.equal(jwt.decode(res.data.token).role, 'patient');

  const row = api.db.prepare('SELECT name, email, role, password_hash FROM users WHERE id = ?').get(res.data.user.id);
  assert.equal(row.email, 'hamza.tariq@example.com');
  assert.equal(row.role, 'patient');
  assert.match(row.password_hash, /^\$2[aby]\$/);
  assert.equal(row.password_hash.includes(newUser.password), false);

  const me = await api.call('GET', '/api/auth/me', { token: res.data.token });
  assert.equal(me.status, 200);
});

test('the new account can log in later and use patient features', async () => {
  const login = await api.call('POST', '/api/auth/login', { body: { email: 'HAMZA.TARIQ@example.com', password: newUser.password } });
  assert.equal(login.status, 200);
  const created = await api.call('POST', '/api/requests', {
    token: login.data.token, body: { medicine: 'Panadol 500mg', category: 'Painkiller', quantity: '1', notes: '' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.request.patientName, 'Hamza Tariq');
  const list = await api.call('GET', '/api/requests', { token: login.data.token });
  assert.deepEqual(list.data.requests.map(r => r.id), [created.data.request.id]);
});

test('duplicate email (any letter case) is rejected with 409', async () => {
  const res = await api.call('POST', '/api/auth/register', { body: { ...newUser, email: 'HAMZA.tariq@EXAMPLE.com' } });
  assert.equal(res.status, 409);
  assert.ok(res.data.errors.email);
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
});

test('SECURITY: a role sent by the client is ignored; sign-up never creates a doctor', async () => {
  const res = await api.call('POST', '/api/auth/register', {
    body: { name: 'Mallory Admin', email: 'mallory@example.com', password: 'Escalate2026Pass', role: 'doctor', isAdmin: true },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.user.role, 'patient');
  assert.equal(api.db.prepare('SELECT role FROM users WHERE email = ?').get('mallory@example.com').role, 'patient');
  const decide = await api.call('PATCH', '/api/reviews/1', { token: res.data.token, body: { decision: 'reviewed', note: 'x' } });
  assert.equal(decide.status, 403);
});

test('server-side validation of name, email and password policy', async () => {
  const cases = [
    [{}, ['name', 'email', 'password']],
    [{ ...newUser, name: '  ', email: 'a@b.co' }, ['name']],
    [{ ...newUser, name: 'Al', email: 'a@b.co' }, ['name']],
    [{ ...newUser, name: '<script>alert(1)</script>', email: 'a@b.co' }, ['name']],
    [{ ...newUser, name: 'x'.repeat(81), email: 'a@b.co' }, ['name']],
    [{ ...newUser, email: 'not-an-email' }, ['email']],
    [{ ...newUser, email: 'a@b.co', password: 'short1A' }, ['password']],
    [{ ...newUser, email: 'a@b.co', password: 'alllowercase123' }, ['password']],
    [{ ...newUser, email: 'a@b.co', password: 'NoNumbersHere' }, ['password']],
    [{ ...newUser, email: 'a@b.co', password: `Aa1${'x'.repeat(126)}` }, ['password']],
    [{ ...newUser, email: 'ayesha@b.co', password: 'Ayesha12345' }, ['password']],
  ];
  for (const [body, fields] of cases) {
    const res = await api.call('POST', '/api/auth/register', { body });
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 70));
    assert.deepEqual(Object.keys(res.data.errors).sort(), fields.sort(), JSON.stringify(body).slice(0, 70));
  }
  // Names in other scripts and with common punctuation are accepted.
  const urdu = await api.call('POST', '/api/auth/register', { body: { name: "علی O'Brien-Khan", email: 'urdu@example.com', password: 'Lahore2026Name' } });
  assert.equal(urdu.status, 201);
});

test('SQL injection in registration fields is rejected or stored as plain text', async () => {
  const res = await api.call('POST', '/api/auth/register', { body: { name: "Robert'); DROP TABLE users;--", email: 'bobby@example.com', password: 'Bobby2026Tables' } });
  assert.equal(res.status, 400);
  assert.ok(api.db.prepare('SELECT COUNT(*) AS n FROM users').get().n >= 1, 'users table still exists');
});

test('account creation is rate limited per client address', async () => {
  const local = await startServer({ sampleData: false });
  try {
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await local.call('POST', '/api/auth/register', { body: { name: 'Bulk User', email: `bulk${i}@example.com`, password: 'BulkUser2026' } });
    }
    assert.equal(last.status, 429);
    assert.ok(Number(last.headers.get('retry-after')) > 0);
  } finally {
    await local.close();
  }
});

test('the doctor account is created from .env settings, not from sign-up', async () => {
  const local = await startServer({ sampleData: false, env: { DOCTOR_NAME: 'Dr Ayesha Raza', DOCTOR_EMAIL: 'Doctor@GenMed.local', DOCTOR_PASSWORD: 'Clinic2026Secure' } });
  try {
    const row = local.db.prepare('SELECT name, role, password_hash FROM users WHERE email = ?').get('doctor@genmed.local');
    assert.equal(row.role, 'doctor');
    assert.match(row.password_hash, /^\$2[aby]\$/);
    const login = await local.call('POST', '/api/auth/login', { body: { email: 'doctor@genmed.local', password: 'Clinic2026Secure' } });
    assert.equal(login.data.user.role, 'doctor');
  } finally {
    await local.close();
  }
});
