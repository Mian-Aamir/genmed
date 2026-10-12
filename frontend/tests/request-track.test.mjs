import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoUsers } from '../src/data/demoUsers.js';
import {
  STATUSES, addOwnRequest, listOwnRequests, getOwnRequest, resetRequestStore,
} from '../src/services/requestStore.js';
import {
  MAX_REFERENCE_LENGTH, normaliseReference, isValidReferenceQuery,
  isValidStatus, filterRequests,
} from '../src/services/trackHelpers.js';

const account = demoUsers.find(user => user.role === 'patient');
const patient = { id: account.id, name: account.name, role: account.role };
const other = { id: 'tracking-other-patient', name: 'Other Patient', role: 'patient' };
const fields = { medicine: 'Paracetamol', category: 'Painkiller', quantity: 2, notes: '' };
const own = () => listOwnRequests(patient).requests;
const ids = requests => requests.map(request => request.id);

beforeEach(() => resetRequestStore());

test('normalises lowercase and surrounding whitespace for live search', () => {
  for (const query of ['gm-1002', ' GM-1002 ']) {
    assert.equal(normaliseReference(query), 'GM-1002');
    assert.equal(isValidReferenceQuery(query), true);
    assert.deepEqual(ids(filterRequests(own(), query)), ['GM-1002']);
  }
});

test('empty search and partial prefixes work while typing', () => {
  for (const query of ['', '   ', 'g', 'GM', 'GM-', 'GM-10']) {
    assert.equal(isValidReferenceQuery(query), true);
    assert.equal(filterRequests(own(), query).length, 3);
  }
  assert.deepEqual(filterRequests(own(), 'GM-9999'), []);
});

test('invalid formats, types and oversized queries fail closed', () => {
  assert.equal(MAX_REFERENCE_LENGTH, 20);
  for (const query of ['abc', '1002', 'GM-10022', 'GM-1x', 'GM- 10', '<script>', null, 1002, {}, ' '.repeat(21), `GM-1002${' '.repeat(14)}`]) {
    assert.equal(isValidReferenceQuery(query), false);
    assert.deepEqual(filterRequests(own(), query), []);
  }
  assert.equal(normaliseReference(null), '');
});

test('each known status filters correctly and All restores the list', () => {
  addOwnRequest(patient, fields);
  for (const status of STATUSES) {
    assert.equal(isValidStatus(status), true);
    const matches = filterRequests(own(), '', status);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].status, status);
  }
  assert.equal(filterRequests(own(), '', 'All').length, 4);
});

test('unknown statuses are rejected instead of widening results', () => {
  for (const status of ['all', 'approved', ' Approved ', '', 'Admin', null, {}]) {
    assert.equal(isValidStatus(status), false);
    assert.deepEqual(filterRequests(own(), '', status), []);
  }
});

test('reference search and status filter are applied together', () => {
  assert.deepEqual(ids(filterRequests(own(), ' gm-10 ', 'Approved')), ['GM-1002']);
  assert.deepEqual(filterRequests(own(), 'GM-1002', 'Delivered'), []);
});

test('fresh store reads include Module 1 submissions in newest-first order', () => {
  assert.equal(own().length, 3);
  const added = addOwnRequest(patient, fields);
  assert.equal(added.ok, true);
  assert.equal(own()[0].id, added.request.id);
  assert.deepEqual(ids(filterRequests(own(), 'gm-1004', 'Pending')), ['GM-1004']);
  assert.deepEqual(getOwnRequest(patient, added.request.id).request, added.request);
});

test('list and tracking results include only the session owner records', () => {
  const privateRequest = addOwnRequest(other, fields).request;
  assert.ok(own().every(request => request.ownerId === patient.id));
  assert.deepEqual(filterRequests(own(), privateRequest.id), []);
  assert.deepEqual(ids(listOwnRequests(other).requests), [privateRequest.id]);
});

test('guessing another patient reference cannot open details in either direction', () => {
  const privateRequest = addOwnRequest(other, fields).request;
  const notFound = { ok: false, message: 'Request not found' };
  assert.deepEqual(getOwnRequest(patient, privateRequest.id), notFound);
  assert.deepEqual(getOwnRequest(other, 'GM-1002'), notFound);
  assert.deepEqual(getOwnRequest(patient, 'GM-9999'), notFound);
  for (const session of [null, { ...patient, role: 'doctor' }]) {
    assert.deepEqual(listOwnRequests(session), { ok: false, message: 'Access Denied' });
    assert.deepEqual(getOwnRequest(session, 'GM-1002'), { ok: false, message: 'Access Denied' });
  }
});

test('filtering preserves source order and does not mutate the supplied list', () => {
  const requests = own();
  const before = structuredClone(requests);
  assert.deepEqual(ids(filterRequests(requests)), ['GM-1003', 'GM-1002', 'GM-1001']);
  assert.deepEqual(requests, before);
  assert.deepEqual(filterRequests(null), []);
});
