import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

export const PATIENT = { email: 'patient@example.com', password: 'PatientDemo1!' };
export const OTHER_PATIENT = { email: 'other.patient@example.com', password: 'OtherPatient1!' };
export const DOCTOR = { email: 'doctor@example.com', password: 'DoctorDemo1!' };

/** Starts the real Express app on a random port with a fresh in-memory SQLite database. */
export async function startServer(options = {}) {
  const db = openDatabase(':memory:', { bcryptRounds: 4 });
  const app = createApp(db, options);
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, path, { token, body, headers = {} } = {}) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data, headers: response.headers };
  }

  async function login(account) {
    const res = await call('POST', '/api/auth/login', { body: account });
    if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
    return res.data.token;
  }

  return { db, call, login, close: () => new Promise(resolve => server.close(resolve)) };
}
