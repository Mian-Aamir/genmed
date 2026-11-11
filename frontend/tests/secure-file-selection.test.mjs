// Activity 5 Task 3 — Ammar Ahmad (23P-3071): supporting document selection.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCEPT_ATTRIBUTE, MAX_FILE_BYTES, fileExtension, formatBytes, matchesSignature, validateFileMeta, validateSelectedFile,
} from '../src/services/fileValidation.js';

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const EXE = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];
const file = (bytes, name, type) => new File([new Uint8Array(bytes)], name, { type });

test('permitted PDF, JPG, JPEG and PNG files are accepted', async () => {
  for (const [bytes, name, type] of [
    [PDF, 'prescription.pdf', 'application/pdf'],
    [JPG, 'prescription.jpg', 'image/jpeg'],
    [JPG, 'Prescription.JPEG', 'image/jpeg'],
    [PNG, 'prescription.png', 'image/png'],
  ]) {
    assert.deepEqual(await validateSelectedFile(file(bytes, name, type)), { ok: true, extension: fileExtension(name) }, name);
  }
});

test('unsupported extensions are rejected with a clear message', () => {
  for (const name of ['setup.exe', 'prescription.pdf.exe', 'image.svg', 'page.html', 'report.docx', 'script.js', 'noextension', '.png']) {
    const result = validateFileMeta({ name, size: 100, type: '' });
    assert.equal(result.ok, false, name);
    assert.match(result.error, /Unsupported file type .*Allowed types: PDF, JPG, JPEG or PNG\./, name);
  }
  assert.equal(fileExtension('prescription.pdf.exe'), 'exe');
});

test('files over 2 MB are rejected; exactly 2 MB is accepted', () => {
  assert.equal(MAX_FILE_BYTES, 2 * 1024 * 1024);
  assert.equal(validateFileMeta({ name: 'a.pdf', size: MAX_FILE_BYTES, type: 'application/pdf' }).ok, true);
  const big = validateFileMeta({ name: 'a.pdf', size: 3 * 1024 * 1024, type: 'application/pdf' });
  assert.equal(big.ok, false);
  assert.equal(big.error, 'File is too large (3.0 MB). Maximum size is 2.0 MB.');
  assert.equal(validateFileMeta({ name: 'a.pdf', size: MAX_FILE_BYTES + 1, type: 'application/pdf' }).ok, false);
});

test('empty, missing, mismatched and badly named files are rejected', () => {
  assert.match(validateFileMeta({ name: 'a.pdf', size: 0, type: 'application/pdf' }).error, /empty/);
  assert.equal(validateFileMeta(null).error, 'Choose a file.');
  assert.match(validateFileMeta({ name: 'a.pdf', size: 10, type: 'text/html' }).error, /does not match its \.pdf extension/);
  assert.match(validateFileMeta({ name: `${'a'.repeat(101)}.pdf`, size: 10, type: 'application/pdf' }).error, /100 characters/);
  assert.match(validateFileMeta({ name: '..\\..\\x.pdf', size: 10, type: 'application/pdf' }).error, /path/);
});

test('a program renamed to .pdf is rejected by its first bytes', async () => {
  assert.equal(matchesSignature(new Uint8Array(EXE), 'pdf'), false);
  assert.equal(matchesSignature(new Uint8Array(PDF), 'pdf'), true);
  const result = await validateSelectedFile(file(EXE, 'prescription.pdf', 'application/pdf'));
  assert.equal(result.ok, false);
  assert.match(result.error, /not a real PDF file/);
});

test('accept attribute and size formatting', () => {
  assert.equal(ACCEPT_ATTRIBUTE, '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png');
  assert.equal(formatBytes(193), '193 B');
  assert.equal(formatBytes(2048), '2.0 KB');
});
