import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoUsers } from '../src/data/demoUsers.js';
import { MEDICINE_NAME_PATTERN, validateRequest, validateReview } from '../src/services/requestValidation.js';
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

// ---------------- Activity 5 Task 1 (Ammar Ahmad) ----------------
test('A5 medicine name accepts real formats and is trimmed', () => {
  for (const medicine of ['Cetirizine 5 mg / 5 mL', 'Co-Amoxiclav (625)', "St. John's Wort", 'ORS 0.9% + Zinc']) {
    const result = validateRequest({ ...valid, medicine: `  ${medicine}  ` }, CATEGORIES);
    assert.equal(result.ok, true, medicine);
    assert.equal(result.values.medicine, medicine);
  }
  assert.ok(MEDICINE_NAME_PATTERN.test('Paracetamol 500mg'));
});

test('A5 medicine name rejects markup and unexpected characters without saving', () => {
  for (const medicine of ['<script>alert("xss")</script>', 'Panadol<b>', 'Brufen"onmouseover', '{{7*7}}', '-Panadol']) {
    const outcome = addOwnRequest(patient, { ...valid, medicine });
    assert.equal(outcome.ok, false, medicine);
    assert.match(outcome.errors.medicine, /letters, numbers/);
  }
  assert.equal(listOwnRequests(patient).requests.length, 3);
});

test('A5 doctor review requires an allowlisted decision and a 1-300 character trimmed note', () => {
  assert.equal(validateReview('', 'Check dosage').errors.decision, 'Choose a review decision.');
  assert.equal(validateReview('approve-all', 'Check dosage').ok, false);
  assert.equal(validateReview('reviewed', '').errors.note, 'Internal note is required.');
  assert.equal(validateReview('reviewed', '    ').errors.note, 'Internal note is required.');
  assert.equal(validateReview('reviewed', undefined).ok, false);
  assert.match(validateReview('reviewed', 'x'.repeat(301)).errors.note, /300 characters or fewer/);
  assert.equal(validateReview('discussion', 'x').ok, true);
  assert.equal(validateReview('reviewed', 'x'.repeat(300)).ok, true);
  assert.equal(validateReview('discussion', '  Check dosage.  ').values.note, 'Check dosage.');
});
