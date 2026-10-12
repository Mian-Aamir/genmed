import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoUsers } from '../src/data/demoUsers.js';
import {
  STATUSES, CATEGORIES, listOwnRequests, getOwnRequest,
  addOwnRequest, resetRequestStore,
} from '../src/services/requestStore.js';

const account = demoUsers.find(user => user.role === 'patient');
const patient = { id: account.id, name: account.name, role: account.role };
const otherPatient = { id: 'other-patient', name: 'Other Patient', role: 'patient' };
const fields = { medicine: 'Paracetamol', category: 'Painkiller', quantity: 2, notes: '' };

beforeEach(() => resetRequestStore());

test('shared constants and sample records match the contract', () => {
  assert.deepEqual(STATUSES, ['Pending', 'Approved', 'Dispatched', 'Delivered']);
  assert.deepEqual(CATEGORIES, ['Painkiller', 'Antibiotic', 'Allergy', 'Stomach/Acid', 'Other']);
  const result = listOwnRequests(patient);
  assert.equal(result.ok, true);
  assert.deepEqual(result.requests.map(request => [request.id, request.status]), [
    ['GM-1003', 'Dispatched'], ['GM-1002', 'Approved'], ['GM-1001', 'Delivered'],
  ]);
  assert.ok(result.requests.every(request => request.ownerId === account.id));
});

test('new references are sequential, Pending, dated today, and listed newest first', () => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const first = addOwnRequest(patient, fields);
  const second = addOwnRequest(patient, fields);
  assert.equal(first.request.id, 'GM-1004');
  assert.equal(second.request.id, 'GM-1005');
  assert.equal(first.request.status, 'Pending');
  assert.equal(first.request.date, today);
  assert.match(first.request.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(listOwnRequests(patient).requests[0].id, 'GM-1005');
});

test('ownership and protected fields come from the session and store, never input', () => {
  const result = addOwnRequest(patient, {
    ...fields, ownerId: otherPatient.id, patientName: 'Impersonated',
    id: 'GM-9999', status: 'Delivered', date: '1900-01-01',
  });
  assert.equal(result.request.ownerId, patient.id);
  assert.equal(result.request.patientName, patient.name);
  assert.equal(result.request.id, 'GM-1004');
  assert.equal(result.request.status, 'Pending');
  assert.notEqual(result.request.date, '1900-01-01');
  assert.deepEqual(listOwnRequests(otherPatient).requests, []);
  assert.deepEqual(getOwnRequest(otherPatient, result.request.id), { ok: false, message: 'Request not found' });
  assert.deepEqual(getOwnRequest(otherPatient, 'GM-9999'), { ok: false, message: 'Request not found' });
});

test('Doctor, anonymous, unknown-role and malformed sessions are denied for every action', () => {
  for (const session of [null, {}, { ...patient, role: 'doctor' }, { ...patient, role: 'admin' }, { ...patient, id: '' }, { ...patient, name: '  ' }]) {
    assert.deepEqual(listOwnRequests(session), { ok: false, message: 'Access Denied' });
    assert.deepEqual(getOwnRequest(session, 'GM-1001'), { ok: false, message: 'Access Denied' });
    assert.deepEqual(addOwnRequest(session, fields), { ok: false, message: 'Access Denied' });
  }
  assert.equal(listOwnRequests(patient).requests.length, 3);
});

test('returned records cannot mutate the store', () => {
  const added = addOwnRequest(patient, fields);
  added.request.ownerId = otherPatient.id;
  const list = listOwnRequests(patient);
  list.requests[0].status = 'Delivered';
  const detail = getOwnRequest(patient, 'GM-1004');
  detail.request.medicine = 'Modified';
  assert.equal(getOwnRequest(patient, 'GM-1004').request.status, 'Pending');
  assert.equal(getOwnRequest(patient, 'GM-1004').request.medicine, 'Paracetamol');
});

test('20-request limit includes samples and is per patient', () => {
  for (let i = 0; i < 17; i++) assert.equal(addOwnRequest(patient, fields).ok, true);
  assert.equal(listOwnRequests(patient).requests.length, 20);
  assert.equal(addOwnRequest(patient, fields).ok, false);
  assert.equal(addOwnRequest(otherPatient, fields).ok, true);
  assert.equal(listOwnRequests(otherPatient).requests.length, 1);
});

test('reset restores the samples and reference sequence', () => {
  addOwnRequest(patient, fields);
  assert.deepEqual(resetRequestStore(), { ok: true });
  assert.equal(listOwnRequests(patient).requests.length, 3);
  assert.equal(addOwnRequest(patient, fields).request.id, 'GM-1004');
});
