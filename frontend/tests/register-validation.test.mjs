// Registration form validation (client) must match the server rules exactly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../src/services/authValidation.js';
import { validateRegistration as serverValidate } from '../../backend/src/validation.js';

const valid = { name: 'Hamza Tariq', email: 'hamza@example.com', password: 'Lahore2026Pass' };

test('valid registration is normalised', () => {
  const result = validateRegistration({ ...valid, name: '  Hamza   Tariq ', email: ' Hamza@Example.com ', confirmPassword: valid.password });
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, { name: 'Hamza Tariq', email: 'hamza@example.com', password: valid.password });
});

test('confirm password must match', () => {
  assert.equal(validateRegistration({ ...valid, confirmPassword: 'Different2026' }).errors.confirmPassword, 'Passwords do not match.');
});

test('client and server give identical results', () => {
  const samples = [
    valid, {}, { ...valid, name: '' }, { ...valid, name: 'Al' }, { ...valid, name: '<b>Ali</b>' }, { ...valid, name: "علی O'Brien-Khan" },
    { ...valid, email: 'bad' }, { ...valid, password: 'short1A' }, { ...valid, password: 'nouppercase123' },
    { ...valid, password: 'NOLOWERCASE123' }, { ...valid, password: 'NoNumbersHere' }, { ...valid, password: `Aa1${'x'.repeat(126)}` },
    { ...valid, email: 'hamza@example.com', password: 'Hamza2026Pass' },
  ];
  for (const sample of samples) {
    const client = validateRegistration(sample);
    const server = serverValidate(sample);
    assert.equal(client.ok, server.ok, JSON.stringify(sample).slice(0, 80));
    assert.deepEqual(Object.keys(client.errors).sort(), Object.keys(server.errors).sort(), JSON.stringify(sample).slice(0, 80));
  }
});
