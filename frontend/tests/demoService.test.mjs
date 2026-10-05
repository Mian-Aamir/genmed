import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoService } from '../src/services/demoService.js';

const patientLogin = service => service.login('patient@example.com', 'PatientDemo1!');
const doctorLogin = service => service.login('doctor@example.com', 'DoctorDemo1!');

test('known accounts only, generic failures, email normalization and exact passwords', () => {
  const service = createDemoService();
  assert.equal(service.login('unknown@example.com', 'PatientDemo1!').message, 'Invalid email or password.');
  assert.equal(service.login('patient@example.com', 'WrongPassword1!').message, 'Invalid email or password.');
  assert.equal(service.login('patient@example.com', ' PatientDemo1!').ok, false);
  assert.equal(service.login(' PATIENT@EXAMPLE.COM ', 'PatientDemo1!').ok, true);
  assert.equal(service.snapshot().user.role, 'patient');
  assert.equal('password' in service.snapshot().user, false);
  assert.equal(doctorLogin(service).ok, false);
});

test('five failures lock for 30 seconds; logout cannot bypass; success resets count', () => {
  let time = 100000;
  const service = createDemoService(() => time);
  for (let i = 0; i < 5; i++) service.login('unknown@example.com', 'invalid');
  assert.equal(service.remainingSeconds(), 30);
  service.logout();
  assert.equal(patientLogin(service).ok, false);
  time += 29999;
  assert.equal(service.remainingSeconds(), 1);
  time += 1;
  assert.equal(patientLogin(service).ok, true);
  service.logout();
  for (let i = 0; i < 4; i++) service.login('unknown@example.com', 'invalid');
  assert.equal(patientLogin(service).ok, true);
  service.logout();
  service.login('unknown@example.com', 'invalid');
  assert.equal(service.remainingSeconds(), 0);
});

test('unauthenticated and wrong-role mutations are denied without changes; snapshots cannot grant roles', () => {
  const service = createDemoService();
  assert.equal(service.requestReview(1).message, 'Access Denied');
  assert.equal(service.decideReview('REQ-001', 'reviewed', 'Demo').message, 'Access Denied');
  patientLogin(service);
  const before = service.snapshot();
  assert.equal(service.decideReview('REQ-001', 'reviewed', 'Unauthorized').message, 'Access Denied');
  assert.equal(service.decideReview('REQ-002', 'reviewed', 'Other owner').message, 'Access Denied');
  assert.deepEqual(service.snapshot(), before);
  const forgedSnapshot = service.snapshot();
  forgedSnapshot.user.role = 'doctor';
  forgedSnapshot.requests[0].status = 'reviewed';
  assert.equal(service.decideReview('REQ-001', 'reviewed', 'Forged role').message, 'Access Denied');
  assert.deepEqual(service.snapshot(), before);
  service.logout();
  doctorLogin(service);
  assert.equal(service.requestReview(2).message, 'Access Denied');
});

test('patient sees owned requests without notes; doctor sees masked contact', () => {
  const service = createDemoService();
  patientLogin(service);
  const patientRequests = service.snapshot().requests;
  assert.equal(patientRequests.length, 1);
  for (const field of ['internalNote', 'patientEmail', 'maskedEmail', 'patientId']) {
    assert.equal(field in patientRequests[0], false);
  }
  service.logout();
  doctorLogin(service);
  const doctorRequests = service.snapshot().requests;
  assert.equal(doctorRequests.length, 2);
  assert.equal(doctorRequests[0].maskedEmail, 'p***@example.com');
  assert.equal('patientEmail' in doctorRequests[0], false);
  assert.ok(doctorRequests[0].internalNote);
});

test('patient request -> doctor decision -> patient status persists across role changes', () => {
  const service = createDemoService();
  patientLogin(service);
  assert.equal(service.requestReview(8).ok, true);
  const created = service.snapshot().requests.at(-1);
  assert.equal(service.requestReview(8).ok, false);
  service.logout();
  assert.deepEqual(service.snapshot(), { user: null, requests: [] });
  doctorLogin(service);
  assert.equal(service.decideReview(created.id, 'reviewed', 'Fictional internal note.').ok, true);
  assert.equal(service.decideReview(created.id, 'discussion', 'Duplicate review').ok, false);
  service.logout();
  patientLogin(service);
  const updated = service.snapshot().requests.find(item => item.id === created.id);
  assert.equal(updated.status, 'reviewed');
  assert.equal('internalNote' in updated, false);
  service.logout();
  assert.equal(service.decideReview(created.id, 'reviewed', 'After logout').message, 'Access Denied');
});

test('invalid medicine IDs, decisions, missing records and invalid notes fail', () => {
  const service = createDemoService();
  patientLogin(service);
  for (const id of [999, '1', null, -1, 1.5]) assert.equal(service.requestReview(id).ok, false);
  service.logout();
  doctorLogin(service);
  for (const [id, status, note] of [
    ['missing', 'reviewed', 'Demo'], ['REQ-001', 'admin', 'Demo'],
    ['REQ-001', 'reviewed', '  '], ['REQ-001', 'reviewed', 'x'.repeat(301)],
  ]) assert.equal(service.decideReview(id, status, note).ok, false);
  assert.equal(service.snapshot().requests[0].status, 'pending');
});

test('request count is bounded; fresh app resets the demo', () => {
  const service = createDemoService();
  for (let i = 0; i < 19; i++) {
    patientLogin(service);
    assert.equal(service.requestReview(2).ok, true);
    const id = service.snapshot().requests.at(-1).id;
    service.logout();
    doctorLogin(service);
    service.decideReview(id, 'discussion', 'Demo only');
    service.logout();
  }
  patientLogin(service);
  assert.equal(service.requestReview(3).ok, false);
  assert.equal(service.snapshot().requests.length, 20);
  assert.deepEqual(createDemoService().snapshot(), { user: null, requests: [] });
});
