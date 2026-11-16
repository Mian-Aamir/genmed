// Module 2 (Ammar Ahmad): submit, view and track medicine requests.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { DOCTOR, OTHER_PATIENT, PATIENT, startServer } from './helpers.mjs';

let api; let patient; let other; let doctor;
before(async () => {
  api = await startServer();
  [patient, other, doctor] = await Promise.all([api.login(PATIENT), api.login(OTHER_PATIENT), api.login(DOCTOR)]);
});
after(() => api.close());

const valid = { medicine: '  Cetirizine 5 mg / 5 mL ', category: 'Allergy', quantity: '2', notes: '  for hay fever  ' };

test('requests require a valid token', async () => {
  assert.equal((await api.call('GET', '/api/requests')).status, 401);
  assert.equal((await api.call('POST', '/api/requests', { body: valid })).status, 401);
});

test('patient lists only own requests, newest first', async () => {
  const res = await api.call('GET', '/api/requests', { token: patient });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.requests.map(r => r.id), ['GM-1003', 'GM-1002', 'GM-1001']);
  assert.ok(res.data.requests.every(r => r.patientName === 'Ali Demo'));
});

test('patient submits a request: trimmed, stored in SQLite, server sets owner/date/status', async () => {
  const res = await api.call('POST', '/api/requests', {
    token: patient,
    body: { ...valid, id: 'GM-1', ownerId: 999, patientName: 'Mallory', status: 'Delivered', date: '1999-01-01' },
  });
  assert.equal(res.status, 201);
  const { request } = res.data;
  assert.match(request.id, /^GM-\d{4}$/);
  assert.equal(request.medicine, 'Cetirizine 5 mg / 5 mL');
  assert.equal(request.notes, 'for hay fever');
  assert.equal(request.quantity, 2);
  assert.equal(request.status, 'Pending');
  assert.equal(request.patientName, 'Ali Demo');
  assert.match(request.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(request.date, '1999-01-01');
  assert.equal(res.data.message, `Request ${request.id} submitted successfully`);

  const listed = await api.call('GET', '/api/requests', { token: patient });
  assert.equal(listed.data.requests[0].id, request.id);
  const detail = await api.call('GET', `/api/requests/${request.id.toLowerCase()}`, { token: patient });
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.data.request, request);
});

test('server-side validation rejects empty, oversized and malformed input', async () => {
  const cases = [
    [{}, ['medicine', 'category', 'quantity']],
    [{ ...valid, medicine: '   ' }, ['medicine']],
    [{ ...valid, medicine: 'ab' }, ['medicine']],
    [{ ...valid, medicine: 'x'.repeat(121) }, ['medicine']],
    [{ ...valid, medicine: '<script>alert(1)</script>' }, ['medicine']],
    [{ ...valid, category: 'Poison' }, ['category']],
    [{ ...valid, quantity: '0' }, ['quantity']],
    [{ ...valid, quantity: '21' }, ['quantity']],
    [{ ...valid, quantity: '1e1' }, ['quantity']],
    [{ ...valid, quantity: 2.5 }, ['quantity']],
    [{ ...valid, notes: 'x'.repeat(201) }, ['notes']],
    [{ ...valid, notes: '    ' }, ['notes']],
    [{ ...valid, notes: { $gt: '' } }, ['notes']],
  ];
  const before = api.db.prepare('SELECT COUNT(*) AS n FROM medicine_requests').get().n;
  for (const [body, fields] of cases) {
    const res = await api.call('POST', '/api/requests', { token: patient, body });
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 60));
    assert.deepEqual(Object.keys(res.data.errors).sort(), fields.sort());
  }
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM medicine_requests').get().n, before);
});

test('SQL injection text in notes is stored as plain data', async () => {
  const notes = "x'); DROP TABLE medicine_requests; --";
  const res = await api.call('POST', '/api/requests', { token: patient, body: { ...valid, notes } });
  assert.equal(res.status, 201);
  assert.equal(res.data.request.notes, notes);
  assert.ok(api.db.prepare('SELECT COUNT(*) AS n FROM medicine_requests').get().n > 0);
});

test('a patient cannot open another patient\'s request (same 404 as a missing one)', async () => {
  const otherList = await api.call('GET', '/api/requests', { token: other });
  const otherRef = otherList.data.requests[0].id;
  const probe = await api.call('GET', `/api/requests/${otherRef}`, { token: patient });
  const missing = await api.call('GET', '/api/requests/GM-999999', { token: patient });
  assert.equal(probe.status, 404);
  assert.deepEqual(probe.data, missing.data);
  for (const ref of ['abc', "GM-1001' OR '1'='1", 'GM-']) {
    assert.equal((await api.call('GET', `/api/requests/${encodeURIComponent(ref)}`, { token: patient })).status, 404, ref);
  }
});

test('ROLE: a doctor cannot submit a patient request (403)', async () => {
  const res = await api.call('POST', '/api/requests', { token: doctor, body: valid });
  assert.equal(res.status, 403);
});

test('ROLE: only a doctor can update a request status', async () => {
  const denied = await api.call('PATCH', '/api/requests/GM-1001/status', { token: patient, body: { status: 'Delivered' } });
  assert.equal(denied.status, 403);
  const bad = await api.call('PATCH', '/api/requests/GM-1004/status', { token: doctor, body: { status: 'Shipped' } });
  assert.equal(bad.status, 400);
  const ok = await api.call('PATCH', '/api/requests/GM-1004/status', { token: doctor, body: { status: 'Approved' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.request.status, 'Approved');
  const seenByOwner = await api.call('GET', '/api/requests/GM-1004', { token: other });
  assert.equal(seenByOwner.data.request.status, 'Approved');
});

test('the 20-request limit is enforced per patient on the server', async () => {
  let res;
  for (let i = 0; i < 25; i += 1) {
    res = await api.call('POST', '/api/requests', { token: other, body: valid });
    if (res.status !== 201) break;
  }
  assert.equal(res.status, 409);
  const me = await api.call('GET', '/api/auth/me', { token: other });
  assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM medicine_requests WHERE owner_id = ?').get(me.data.user.id).n, 20);
});
