import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  ALLOWED_SUPPORTING_EXTENSIONS, MAX_SUPPORTING_FILE_SIZE, validateSupportingFile,
} from '../src/services/fileValidation.js';
import { REVIEW_DECISIONS, validateReview } from '../src/services/reviewValidation.js';
import { CATEGORIES, addOwnRequest, getOwnRequest, resetRequestStore } from '../src/services/requestStore.js';
import { demoUsers } from '../src/data/demoUsers.js';

const account = demoUsers.find(user => user.role === 'patient');
const patient = { id: account.id, name: account.name, role: account.role };

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

test('script-like medicine and notes remain stored as text and are never executed by the store', () => {
  resetRequestStore();
  const scriptText = '<script>globalThis.activityFiveXss = true</script>';
  const added = addOwnRequest(patient, {
    medicine: scriptText,
    category: CATEGORIES[0],
    quantity: 1,
    notes: scriptText,
  });
  assert.equal(added.ok, true);
  const detail = getOwnRequest(patient, added.request.id);
  assert.equal(detail.request.medicine, scriptText);
  assert.equal(detail.request.notes, scriptText);
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
  const combined = source.join('\n');
  assert.doesNotMatch(combined, /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(/);
  assert.doesNotMatch(combined, /localStorage|sessionStorage/);
});
