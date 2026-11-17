// Module 1 (Muhammad Aamir): review requests, role-based authorization and data minimisation.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { DOCTOR, OTHER_PATIENT, PATIENT, startServer } from './helpers.mjs';

let api; let patient; let other; let doctor;
before(async () => {
  api = await startServer();
  [patient, other, doctor] = await Promise.all([api.login(PATIENT), api.login(OTHER_PATIENT), api.login(DOCTOR)]);
});
after(() => api.close());

test('patient sees only own review requests and no internal notes', async () => {
  const res = await api.call('GET', '/api/reviews', { token: patient });
  assert.equal(res.status, 200);
  assert.equal(res.data.requests.length, 1);
  for (const request of res.data.requests) {
    assert.equal('internalNote' in request, false);
    assert.equal('maskedEmail' in request, false);
  }
});

test('doctor sees all requests with masked contact and internal notes', async () => {
  const res = await api.call('GET', '/api/reviews', { token: doctor });
  assert.equal(res.status, 200);
  assert.ok(res.data.requests.length >= 2);
  for (const request of res.data.requests) {
    assert.match(request.maskedEmail, /^[a-z]\*\*\*@example\.com$/);
    assert.equal(typeof request.internalNote, 'string');
  }
});

test('patient submits a review request; it is stored and retrievable', async () => {
  const created = await api.call('POST', '/api/reviews', { token: patient, body: { medicineId: 4, patientId: 999 } });
  assert.equal(created.status, 201);
  const row = api.db.prepare('SELECT patient_id, medicine_id, status FROM review_requests WHERE id = ?').get(created.data.id);
  assert.equal(row.medicine_id, 4);
  assert.equal(row.status, 'pending');
  const me = await api.call('GET', '/api/auth/me', { token: patient });
  assert.equal(row.patient_id, me.data.user.id, 'owner comes from the token, not the body');
  const duplicate = await api.call('POST', '/api/reviews', { token: patient, body: { medicineId: 4 } });
  assert.equal(duplicate.status, 409);
});

test('invalid medicine ids are rejected by server-side validation', async () => {
  for (const medicineId of ['4', 0, -1, 4.5, 9999, null, "1 OR 1=1"]) {
    const res = await api.call('POST', '/api/reviews', { token: patient, body: { medicineId } });
    assert.equal(res.status, 400, String(medicineId));
  }
});

test('ROLE: a patient cannot record a doctor decision (403) and nothing changes', async () => {
  const res = await api.call('PATCH', '/api/reviews/1', { token: patient, body: { decision: 'reviewed', note: 'self-approved' } });
  assert.equal(res.status, 403);
  assert.equal(api.db.prepare('SELECT status FROM review_requests WHERE id = 1').get().status, 'pending');
});

test('ROLE: a doctor cannot submit a patient review request (403)', async () => {
  const res = await api.call('POST', '/api/reviews', { token: doctor, body: { medicineId: 2 } });
  assert.equal(res.status, 403);
});

test('doctor decision is validated, saved once, and visible to the patient', async () => {
  const invalid = await api.call('PATCH', '/api/reviews/1', { token: doctor, body: { decision: 'approved', note: '   ' } });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.data.errors.decision && invalid.data.errors.note);
  const tooLong = await api.call('PATCH', '/api/reviews/1', { token: doctor, body: { decision: 'reviewed', note: 'x'.repeat(301) } });
  assert.equal(tooLong.status, 400);

  const ok = await api.call('PATCH', '/api/reviews/1', { token: doctor, body: { decision: 'reviewed', note: '  <script>alert(1)</script>  ' } });
  assert.equal(ok.status, 200);
  const stored = api.db.prepare('SELECT status, internal_note FROM review_requests WHERE id = 1').get();
  assert.deepEqual({ ...stored }, { status: 'reviewed', internal_note: '<script>alert(1)</script>' });

  const again = await api.call('PATCH', '/api/reviews/1', { token: doctor, body: { decision: 'discussion', note: 'change' } });
  assert.equal(again.status, 409);
  const patientView = await api.call('GET', '/api/reviews', { token: patient });
  assert.equal(patientView.data.requests.find(r => r.id === 1).status, 'reviewed');
});

test('another patient cannot see the first patient\'s review requests', async () => {
  const res = await api.call('GET', '/api/reviews', { token: other });
  const me = await api.call('GET', '/api/auth/me', { token: other });
  const ownerIds = api.db.prepare('SELECT id FROM review_requests WHERE patient_id = ?').all(me.data.user.id).map(r => r.id);
  assert.deepEqual(res.data.requests.map(r => r.id).sort(), ownerIds.sort());
});

test('unknown or non-numeric review ids return 404', async () => {
  for (const id of ['9999', 'abc', '1;DROP TABLE users']) {
    const res = await api.call('PATCH', `/api/reviews/${encodeURIComponent(id)}`, { token: doctor, body: { decision: 'reviewed', note: 'x' } });
    assert.equal(res.status, 404, id);
  }
});
