// Module 2 tracking helpers (search + status filter). Activity 6: listing, details and
// ownership checks now come from the API and are tested in backend/tests/requests.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STATUSES } from '../src/services/requestStore.js';
import {
  MAX_REFERENCE_LENGTH, normaliseReference, isValidReferenceQuery,
  isValidStatus, filterRequests,
} from '../src/services/trackHelpers.js';

// Same shape as GET /api/requests returns for the seeded patient account (newest first).
const sample = Object.freeze([
  { id: 'GM-1003', patientName: 'Ali Demo', medicine: 'Cetirizine', category: 'Allergy', quantity: 1, notes: '', date: '2026-10-03', status: 'Dispatched' },
  { id: 'GM-1002', patientName: 'Ali Demo', medicine: 'Omeprazole', category: 'Stomach/Acid', quantity: 2, notes: '', date: '2026-10-02', status: 'Approved' },
  { id: 'GM-1001', patientName: 'Ali Demo', medicine: 'Paracetamol', category: 'Painkiller', quantity: 1, notes: '', date: '2026-10-01', status: 'Delivered' },
]);
const own = () => sample.map(request => ({ ...request }));
const ids = requests => requests.map(request => request.id);

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
  const withPending = [{ ...own()[0], id: 'GM-1004', status: 'Pending' }, ...own()];
  for (const status of STATUSES) {
    assert.equal(isValidStatus(status), true);
    const matches = filterRequests(withPending, '', status);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].status, status);
  }
  assert.equal(filterRequests(withPending, '', 'All').length, 4);
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

test('filtering preserves source order and does not mutate the supplied list', () => {
  const requests = own();
  const before = structuredClone(requests);
  assert.deepEqual(ids(filterRequests(requests)), ['GM-1003', 'GM-1002', 'GM-1001']);
  assert.deepEqual(requests, before);
  assert.deepEqual(filterRequests(null), []);
});
