import { demoUsers } from '../data/demoUsers.js';
import { medicines } from '../data/medicines.js';

const denied = () => ({ ok: false, message: 'Access Denied' });
const invalidLogin = () => ({ ok: false, message: 'Invalid email or password.' });
export const reviewLabels = Object.freeze({
  pending: 'Pending review',
  reviewed: 'Reviewed (demo only)',
  discussion: 'Needs discussion',
});

// SECURITY: These are entirely fictional records. Never put private clinical data in a frontend bundle.
const initialRequests = [
  { id: 'REQ-001', patientId: 'patient-1', patientEmail: 'patient@example.com', medicineId: 1, status: 'pending', internalNote: 'Demo intake: confirm formulation before discussing options.', createdAt: '2026-10-01T09:00:00Z' },
  { id: 'REQ-002', patientId: 'patient-2', patientEmail: 'other.patient@example.com', medicineId: 8, status: 'pending', internalNote: 'Fictional second patient record for ownership testing.', createdAt: '2026-10-02T09:00:00Z' },
];

export function createDemoService(now = () => Date.now()) {
  let currentUser = null;
  let requests = initialRequests.map(request => ({ ...request }));
  let failures = 0;
  let lockedUntil = 0;
  let nextId = 3;

  function remainingSeconds() {
    return Math.max(0, Math.ceil((lockedUntil - now()) / 1000));
  }

  function recordFailure() {
    if (remainingSeconds()) return;
    failures += 1;
    // SECURITY: A shared cooldown survives navigation/logout, but refresh bypasses it.
    // Real rate limiting must be enforced by the backend.
    if (failures >= 5) {
      lockedUntil = now() + 30000;
      failures = 0;
    }
  }

  function login(email, password) {
    if (currentUser) return { ok: false, message: 'Log out before switching accounts.' };
    if (remainingSeconds()) return { ok: false, message: 'Too many attempts. Please wait.' };
    const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    // SECURITY: Exact password comparison is for public demo accounts only, not password storage design.
    // All failures use one message, including unknown users and incorrect passwords.
    const account = safeEmail.length <= 254 && typeof password === 'string' && password.length <= 128
      ? demoUsers.find(user => user.email === safeEmail && user.password === password)
      : null;
    if (!account) {
      recordFailure();
      return invalidLogin();
    }
    failures = 0;
    currentUser = { id: account.id, name: account.name, role: account.role };
    return { ok: true };
  }

  function logout() {
    // SECURITY: Clear the active identity. Shared fictional requests remain for the next demo role.
    currentUser = null;
  }

  function snapshot() {
    if (!currentUser) return { user: null, requests: [] };
    if (!['patient', 'doctor'].includes(currentUser.role)) return { user: null, requests: [] };
    // SECURITY: Ownership filter and explicit field selection avoid exposing internal notes to patients.
    // These projections limit UI exposure only; the bundle and browser memory are not confidential.
    const visible = requests.filter(request => currentUser.role === 'doctor' || request.patientId === currentUser.id);
    return {
      user: { ...currentUser },
      requests: visible.map(request => {
        const common = {
          id: request.id,
          medicineId: request.medicineId,
          status: request.status,
          createdAt: request.createdAt,
        };
        return currentUser.role === 'doctor'
          ? { ...common, patientReference: request.patientId, maskedEmail: `${request.patientEmail[0]}***@example.com`, internalNote: request.internalNote }
          : common;
      }),
    };
  }

  function requestReview(medicineId) {
    // SECURITY: Check the current session at action time; never trust a caller-supplied role or owner ID.
    if (currentUser?.role !== 'patient') return denied();
    if (!Number.isInteger(medicineId) || !medicines.some(medicine => medicine.id === medicineId)) {
      return { ok: false, message: 'Choose a medicine from the sample list.' };
    }
    if (requests.some(request => request.patientId === currentUser.id && request.medicineId === medicineId && request.status === 'pending')) {
      return { ok: false, message: 'You already have a pending request for this medicine.' };
    }
    if (requests.filter(request => request.patientId === currentUser.id).length >= 20) {
      return { ok: false, message: 'The demo limit is 20 requests per patient.' };
    }
    const account = demoUsers.find(user => user.id === currentUser.id);
    requests = [...requests, {
      id: `REQ-${String(nextId++).padStart(3, '0')}`,
      patientId: currentUser.id,
      patientEmail: account.email,
      medicineId,
      status: 'pending',
      internalNote: '',
      createdAt: new Date(now()).toISOString(),
    }];
    return { ok: true, message: 'Demo review request submitted.' };
  }

  function decideReview(id, status, note) {
    // SECURITY: Authorization belongs inside the mutation, not just around the visible button.
    if (currentUser?.role !== 'doctor') return denied();
    const request = requests.find(item => item.id === id);
    if (!request) return { ok: false, message: 'Request not found.' };
    if (!['reviewed', 'discussion'].includes(status)) return { ok: false, message: 'Choose a valid review decision.' };
    if (typeof note !== 'string' || !note.trim() || note.length > 300) {
      return { ok: false, message: 'Enter an internal note between 1 and 300 characters.' };
    }
    if (request.status !== 'pending') return { ok: false, message: 'This request has already been reviewed.' };
    requests = requests.map(item => item.id === id ? { ...item, status, internalNote: note.trim() } : item);
    return { ok: true, message: 'Demo decision saved. This is not medical approval.' };
  }

  // SECURITY: Return copies and narrow actions; there is no public setUser/setRole/setRequests API.
  return Object.freeze({ login, logout, snapshot, requestReview, decideReview, remainingSeconds, recordFailure });
}
