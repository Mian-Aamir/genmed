// Activity 5 — Muhammad Aamir (23F-3073): Task 5 password strength checker and
// Task 4 sensitive information handling. Runs in Node without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

function loadHelper() {
  // The provided file is a classic browser script: run it with a fake `window`.
  const sandbox = { window: {} };
  vm.runInNewContext(read('public/password_strength_helper.js'), sandbox);
  return sandbox.window.checkPasswordStrength;
}

function sourceFiles(directory) {
  return readdirSync(directory).flatMap(name => {
    const full = path.join(directory, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : [full];
  }).filter(file => /\.(js|jsx)$/.test(file));
}

// ---------------- Task 5 ----------------
test('T5 helper defines window.checkPasswordStrength as a browser global', () => {
  assert.equal(typeof loadHelper(), 'function');
});

test('T5 index.html loads the helper before the React app', () => {
  const html = read('index.html');
  const helper = html.indexOf('<script src="/password_strength_helper.js"></script>');
  const app = html.indexOf('src="/src/main.jsx"');
  assert.ok(helper > 0, 'helper script tag present');
  assert.ok(helper < app, 'helper loads before main.jsx');
});

test('T5 Weak, Moderate and Strong examples', () => {
  const check = loadHelper();
  for (const [password, level, score] of [
    ['ali123', 'Weak', 1],
    ['password', 'Weak', 1],
    ['Genmed2026', 'Moderate', 3],
    ['Genmed2026Pk', 'Moderate', 4],
    ['Gen#Med!Pharmacy2026', 'Strong', 6],
  ]) {
    const result = check(password);
    assert.equal(result.level, level, password);
    assert.equal(result.score, score, password);
    assert.equal(result.maximumScore, 6);
    assert.equal(typeof result.message, 'string');
  }
});

test('T5 helper handles empty and non-string input safely', () => {
  const check = loadHelper();
  assert.equal(check('').level, 'Weak');
  assert.equal(check(undefined).score, 0);
  assert.equal(check({ toString: () => 'Gen#Med!Pharmacy2026' }).level, 'Weak');
});

test('T5 Login calls the global on change and the result never contains the password', () => {
  const login = read('src/pages/Login.jsx');
  assert.match(login, /window\.checkPasswordStrength\(password\)/);
  assert.match(login, /onChange=\{onPasswordChange\}/);
  const result = loadHelper()('Gen#Med!Pharmacy2026');
  assert.equal(JSON.stringify(result).includes('Gen#Med!Pharmacy2026'), false);
});

// ---------------- Task 4 ----------------
test('T4 no source file writes to localStorage, sessionStorage or cookies', () => {
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const code = readFileSync(file, 'utf8');
    assert.doesNotMatch(code, /(localStorage|sessionStorage)\.setItem|document\.cookie\s*=/, path.relative(root, file));
  }
});

test('T4 no source file logs to the console', () => {
  for (const file of sourceFiles(path.join(root, 'src'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /console\.(log|info|debug)\(/, path.relative(root, file));
  }
});

test('T4 no API keys, tokens or private keys are bundled in the frontend', () => {
  const pattern = /(api[_-]?key|secret[_-]?key|private[_-]?key|BEGIN [A-Z ]*PRIVATE KEY|sk_live_|AKIA[0-9A-Z]{16})/i;
  for (const file of sourceFiles(path.join(root, 'src'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), pattern, path.relative(root, file));
  }
});

test('T4/A6 no passwords are bundled; the JWT is kept only in memory and cleared on logout', () => {
  for (const file of sourceFiles(path.join(root, 'src'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /password:\s*['"]|Demo1!/, path.relative(root, file));
  }
  const context = read('src/context/AuthContext.jsx');
  assert.match(context, /const token = useRef\(null\)/);
  assert.match(context, /token\.current = result\.data\.token/);
  const endSession = context.slice(context.indexOf('const endSession'), context.indexOf('const api = useCallback'));
  assert.match(endSession, /token\.current = null/);
  assert.match(endSession, /setSession\(emptySession\)/);
});

test('T4 logout clears browser storage and remounts the UI', () => {
  const context = read('src/context/AuthContext.jsx');
  assert.match(context, /sessionStorage\.clear\(\)/);
  assert.match(context, /<Fragment key=\{uiSession\}>/);
  const logout = context.slice(context.indexOf('function logout()'), context.indexOf('async function requestReview'));
  assert.match(logout, /endSession\(\)/);
  const endSession = context.slice(context.indexOf('const endSession'), context.indexOf('const api = useCallback'));
  assert.match(endSession, /clearSensitiveBrowserStorage\(\)/);
  assert.match(endSession, /setUiSession/);
});

test('T4 Login clears the password field and its feedback after every submit', () => {
  const login = read('src/pages/Login.jsx');
  assert.match(login, /namedItem\('password'\)\.value = ''/);
  assert.match(login, /setStrength\(null\)/);
  assert.doesNotMatch(login, /useState\([^)]*password/i, 'no password in React state');
});
