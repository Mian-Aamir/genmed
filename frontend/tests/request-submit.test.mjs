import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoUsers } from '../src/data/demoUsers.js';
import { validateRequest } from '../src/services/requestValidation.js';
import { CATEGORIES, addOwnRequest, listOwnRequests, resetRequestStore } from '../src/services/requestStore.js';

const account = demoUsers.find(user => user.role === 'patient');
const patient = { id: account.id, name: account.name, role: account.role };
const valid = { medicine: 'Paracetamol 500mg', category: 'Painkiller', quantity: '2', notes: '' };

beforeEach(() => resetRequestStore());

test('valid submit normalizes text and stores a numeric quantity', () => {
  const result = addOwnRequest(patient, { ...valid, medicine: '  Paracetamol 500mg  ', category: ' Painkiller ', quantity: ' 2 ', notes: ' Demo note ' });
  assert.equal(result.ok, true);
  assert.equal(result.message, 'Request GM-1004 submitted successfully');
  assert.equal(result.request.medicine, 'Paracetamol 500mg');
  assert.equal(result.request.quantity, 2);
  assert.equal(result.request.notes, 'Demo note');
});

for (const [label, changes, field] of [
  ['empty medicine', { medicine: '' }, 'medicine'],
  ['spaces-only medicine', { medicine: '   ' }, 'medicine'],
  ['short medicine', { medicine: 'ab' }, 'medicine'],
  ['oversized medicine', { medicine: 'a'.repeat(121) }, 'medicine'],
  ['empty category', { category: '' }, 'category'],
  ['spaces-only category', { category: '  ' }, 'category'],
  ['unknown category', { category: 'Invalid' }, 'category'],
  ['empty quantity', { quantity: '' }, 'quantity'],
  ['spaces-only quantity', { quantity: '  ' }, 'quantity'],
  ['zero quantity', { quantity: 0 }, 'quantity'],
  ['quantity 21', { quantity: 21 }, 'quantity'],
  ['quantity 5000', { quantity: 5000 }, 'quantity'],
  ['decimal quantity', { quantity: 1.5 }, 'quantity'],
  ['text quantity', { quantity: 'two' }, 'quantity'],
  ['exponent quantity', { quantity: '1e1' }, 'quantity'],
  ['boolean quantity', { quantity: true }, 'quantity'],
  ['oversized notes', { notes: 'x'.repeat(201) }, 'notes'],
  ['spaces-only notes', { notes: '   ' }, 'notes'],
]) {
  test(`rejects ${label} without adding a record or consuming a reference`, () => {
    const input = { ...valid, ...changes };
    assert.equal(validateRequest(input, CATEGORIES).ok, false);
    const outcome = addOwnRequest(patient, input);
    assert.equal(outcome.ok, false);
    assert.ok(outcome.errors[field]);
    assert.equal(listOwnRequests(patient).requests.length, 3);
    assert.equal(addOwnRequest(patient, valid).request.id, 'GM-1004');
  });
}

test('optional notes and boundary values are accepted', () => {
  for (const quantity of [1, 20]) {
    assert.equal(validateRequest({ ...valid, quantity, notes: 'x'.repeat(200) }, CATEGORIES).ok, true);
  }
  assert.equal(validateRequest({ ...valid, notes: undefined }, CATEGORIES).ok, true);
  assert.equal(validateRequest(null, CATEGORIES).ok, false);
});

test('script-like notes remain plain text; the UI must render them using React escaping', () => {
  const notes = '<script>alert("demo")</script>';
  const result = addOwnRequest(patient, { ...valid, notes });
  assert.equal(result.ok, true);
  assert.equal(result.request.notes, notes);
});
