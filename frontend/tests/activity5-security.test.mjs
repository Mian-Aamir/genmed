import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  ALLOWED_SUPPORTING_EXTENSIONS, MAX_SUPPORTING_FILE_SIZE, validateSupportingFile,
} from '../src/services/fileValidation.js';
import { REVIEW_DECISIONS, validateReview } from '../src/services/reviewValidation.js';
import { CATEGORIES } from '../src/services/requestStore.js';
import { validateRequest } from '../src/services/requestValidation.js';
// Activity 6: requests are stored by the backend, so the storage check uses the server validator.
import { validateMedicineRequest } from '../../backend/src/validation.js';

test('instructor password helper returns Weak Moderate and Strong feedback without modification', async () => {
  const helper = await readFile(new URL('../public/password_strength_helper.js', import.meta.url), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(helper, sandbox);
  assert.equal(typeof sandbox.window.checkPasswordStrength, 'function');
  assert.equal(sandbox.window.checkPasswordStrength('short').level, 'Weak');
  assert.equal(sandbox.window.checkPasswordStrength('Abcdef12').level, 'Moderate');
  assert.equal(sandbox.window.checkPasswordStrength('Aa1!abcdefghijklm').level, 'Strong');
});

test('supporting document validation allows only intended extensions at 2 MB or less', () => {
  assert.deepEqual(ALLOWED_SUPPORTING_EXTENSIONS, ['.pdf', '.jpg', '.jpeg', '.png']);
  assert.equal(validateSupportingFile({ name: 'note.PDF', size: MAX_SUPPORTING_FILE_SIZE }).ok, true);
  assert.equal(validateSupportingFile({ name: 'photo.jpeg', size: 100 }).ok, true);
  assert.equal(validateSupportingFile({ name: 'medicine.exe', size: 100 }).ok, false);
  assert.equal(validateSupportingFile({ name: 'large.png', size: MAX_SUPPORTING_FILE_SIZE + 1 }).ok, false);
  assert.equal(validateSupportingFile({ name: 'no-extension', size: 100 }).ok, false);
});

test('doctor review validation rejects empty unexpected and oversized input', () => {
  assert.deepEqual(REVIEW_DECISIONS, ['reviewed', 'discussion']);
  assert.equal(validateReview({ decision: 'reviewed', note: '  Safe fictional note.  ' }).ok, true);
  assert.equal(validateReview({ decision: '', note: 'Note' }).errors.decision, 'Choose a valid review decision.');
  assert.equal(validateReview({ decision: 'admin', note: 'Note' }).ok, false);
  assert.equal(validateReview({ decision: 'reviewed', note: '   ' }).errors.note, 'Enter an internal note.');
  assert.equal(validateReview({ decision: 'reviewed', note: 'x'.repeat(301) }).ok, false);
});

test('script-like notes stay plain text and script-like medicine names are rejected; nothing executes', () => {
  // Activity 6: the in-memory store was replaced by the API. Saving and reading the text back
  // through SQLite is covered in backend/tests/requests.test.mjs.
  const scriptText = '<script>globalThis.activityFiveXss = true</script>';
  const fields = { medicine: 'Paracetamol 500mg', category: CATEGORIES[0], quantity: 1, notes: scriptText };
  for (const result of [validateRequest(fields, CATEGORIES), validateMedicineRequest(fields)]) {
    assert.equal(result.ok, true);
    assert.equal(result.values.notes, scriptText);
  }
  // Stricter than PR #7: markup is not a valid medicine name, in the browser or on the server.
  const scriptName = { ...fields, medicine: scriptText };
  assert.equal(validateRequest(scriptName, CATEGORIES).ok, false);
  assert.equal(validateMedicineRequest(scriptName).ok, false);
  assert.equal(globalThis.activityFiveXss, undefined);
});

test('frontend sources contain no unsafe HTML rendering, eval or browser credential storage', async () => {
  const files = [
    '../src/pages/RequestMedicine.jsx',
    '../src/pages/Login.jsx',
    '../src/context/AuthContext.jsx',
    '../src/components/SecureFileSelection.jsx',
  ];
  const source = await Promise.all(files.map(file => readFile(new URL(file, import.meta.url), 'utf8')));
  // Ignore comments, which may name these sinks to explain why they are not used.
  const combined = source.join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  assert.doesNotMatch(combined, /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(/);
  // Nothing is ever written to browser storage or cookies. (AuthContext reads localStorage keys
  // and clears sessionStorage only to REMOVE sensitive leftovers on start and logout.)
  assert.doesNotMatch(combined, /(localStorage|sessionStorage)\.setItem|document\.cookie\s*=/);
  assert.doesNotMatch(combined, /localStorage\.getItem|sessionStorage\.getItem/);
});
