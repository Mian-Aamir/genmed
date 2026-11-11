// Activity 5 Task 2 — Ammar Ahmad (23P-3071): user text is handled as data, never as HTML.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { demoUsers } from '../src/data/demoUsers.js';
import { createDemoService } from '../src/services/demoService.js';
import { addOwnRequest, getOwnRequest, resetRequestStore } from '../src/services/requestStore.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const account = demoUsers.find(user => user.role === 'patient');
const patient = { id: account.id, name: account.name, role: 'patient' };
const PAYLOADS = [
  '<script>alert("xss")</script>',
  "<script>alert('xss')</script>",
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><a href="javascript:alert(1)">click</a>',
];

beforeEach(() => resetRequestStore());

test('notes containing HTML/script are stored exactly as literal text', () => {
  for (const notes of PAYLOADS) {
    const created = addOwnRequest(patient, { medicine: 'Paracetamol 500mg', category: 'Painkiller', quantity: 1, notes });
    assert.equal(created.ok, true, notes);
    assert.equal(getOwnRequest(patient, created.request.id).request.notes, notes);
  }
});

test('React text rendering (as used by RequestMedicine and TrackRequests) escapes every payload', () => {
  for (const payload of PAYLOADS) {
    // Same pattern as <p className="request-notes">{request.notes}</p> in RequestMedicine.jsx.
    const html = renderToStaticMarkup(createElement('p', { className: 'request-notes' }, payload));
    for (const tag of ['<script', '<img', '<svg', '<a ']) assert.equal(html.includes(tag), false, `${payload} -> ${tag}`);
    assert.match(html, /&lt;/);
  }
  assert.equal(
    renderToStaticMarkup(createElement('p', null, '<script>alert("xss")</script>')),
    '<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>',
  );
});

test('doctor internal notes with script text are saved literally', () => {
  const service = createDemoService();
  const doctor = demoUsers.find(user => user.role === 'doctor');
  service.login(doctor.email, doctor.password);
  assert.equal(service.decideReview('REQ-001', 'reviewed', PAYLOADS[0]).ok, true);
  assert.equal(service.snapshot().requests.find(item => item.id === 'REQ-001').internalNote, PAYLOADS[0]);
});

test('no source file uses an unsafe HTML or code-execution sink', () => {
  const files = (function walk(directory) {
    return readdirSync(directory).flatMap(name => {
      const full = path.join(directory, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  })(path.join(root, 'src')).filter(file => /\.(js|jsx)$/.test(file));
  const unsafe = /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\(|new Function\(|setTimeout\(\s*['"`]/;
  for (const file of files) {
    // Ignore comments, which may name these sinks to explain why they are not used.
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(code, unsafe, path.relative(root, file));
  }
  // The scanner itself must still catch a real sink.
  assert.match('el.innerHTML = note;', unsafe);
});
