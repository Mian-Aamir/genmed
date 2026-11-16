// Client-side validation for the Submit Medicine Request and Doctor Review forms.
// Activity 6: saving, ownership and references are tested against the real API in
// backend/tests/requests.test.mjs. The last test checks the server applies the same rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDICINE_NAME_PATTERN, validateRequest, validateReview } from '../src/services/requestValidation.js';
import { CATEGORIES } from '../src/services/requestStore.js';
import { validateMedicineRequest, validateReviewDecision } from '../../backend/src/validation.js';

const valid = { medicine: 'Paracetamol 500mg', category: 'Painkiller', quantity: '2', notes: '' };

test('valid submit normalizes text and produces a numeric quantity', () => {
  const result = validateRequest({ ...valid, medicine: '  Paracetamol 500mg  ', category: ' Painkiller ', quantity: ' 2 ', notes: ' Demo note ' }, CATEGORIES);
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, { medicine: 'Paracetamol 500mg', category: 'Painkiller', quantity: 2, notes: 'Demo note' });
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
  test(`rejects ${label} in the browser and on the server`, () => {
    const input = { ...valid, ...changes };
    const outcome = validateRequest(input, CATEGORIES);
    assert.equal(outcome.ok, false);
    assert.ok(outcome.errors[field]);
    assert.ok(validateMedicineRequest(input).errors[field], 'server rejects it too');
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
  const result = validateRequest({ ...valid, notes }, CATEGORIES);
  assert.equal(result.ok, true);
  assert.equal(result.values.notes, notes);
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

test('A5 medicine name rejects markup and unexpected characters', () => {
  for (const medicine of ['<script>alert("xss")</script>', 'Panadol<b>', 'Brufen"onmouseover', '{{7*7}}', '-Panadol']) {
    const outcome = validateRequest({ ...valid, medicine }, CATEGORIES);
    assert.equal(outcome.ok, false, medicine);
    assert.match(outcome.errors.medicine, /letters, numbers/);
  }
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

test('A6 the backend applies exactly the same request and review rules as the forms', () => {
  const samples = [
    valid, {}, null, { ...valid, quantity: '20' }, { ...valid, quantity: '21' }, { ...valid, quantity: 1.5 },
    { ...valid, medicine: '  Co-Amoxiclav (625) ' }, { ...valid, medicine: 'Panadol<b>' }, { ...valid, category: 'Other' },
    { ...valid, category: 'Poison' }, { ...valid, notes: 'x'.repeat(200) }, { ...valid, notes: 'x'.repeat(201) }, { ...valid, notes: '  ' },
  ];
  for (const sample of samples) {
    const client = validateRequest(sample, CATEGORIES);
    const server = validateMedicineRequest(sample);
    assert.equal(server.ok, client.ok, JSON.stringify(sample));
    assert.deepEqual(Object.keys(server.errors).sort(), Object.keys(client.errors).sort(), JSON.stringify(sample));
    if (client.ok) assert.deepEqual(server.values, client.values);
  }
  for (const [decision, note] of [['reviewed', 'ok'], ['approve-all', 'ok'], ['discussion', '   '], ['reviewed', 'x'.repeat(301)]]) {
    assert.equal(validateReviewDecision({ decision, note }).ok, validateReview(decision, note).ok, `${decision}/${note.length}`);
  }
});
