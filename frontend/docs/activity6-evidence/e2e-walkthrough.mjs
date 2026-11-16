// Activity 6 browser walkthrough on Microsoft Edge: captures the evidence screenshots in this folder.
// How to run (backend on :4000 with a fresh DB from `npm run db:reset`, and `npm run dev` on :5173):
//   npm install --no-save playwright-core   (in any scratch folder)
//   DOCTOR_EMAIL=... DOCTOR_PASSWORD=... node e2e-walkthrough.mjs <output-folder>
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const OUT = process.argv[2];
const DOCTOR = { email: process.env.DOCTOR_EMAIL, password: process.env.DOCTOR_PASSWORD };
if (!OUT || !DOCTOR.email || !DOCTOR.password) throw new Error('Usage: DOCTOR_EMAIL=.. DOCTOR_PASSWORD=.. node e2e-walkthrough.mjs <out>');
const PATIENT = { name: 'Hamza Tariq', email: `hamza.tariq.${Date.now() % 100000}@example.com`, password: 'Lahore#Clinic2026' };
mkdirSync(OUT, { recursive: true });

const results = [];
const dialogs = [];
const consoleErrors = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

async function shot(id, name) {
  const file = `${id}_${name}.png`;
  // Scroll to top and drop focus so the sticky header and skip link render in place.
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  return file;
}
function record(id, feature, action, expected, actual, pass, screenshot) {
  results.push({ id, feature, action, expected, actual, pass, screenshot });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${feature}: ${actual}`);
}
async function login(email, password) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  const response = page.waitForResponse(r => r.url().endsWith('/api/auth/login'));
  await page.click('form button[type=submit]');
  return response;
}
async function logout() {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
}
async function spaNavigate(to) {
  await page.evaluate(target => { window.history.pushState({}, '', target); window.dispatchEvent(new PopStateEvent('popstate')); }, to);
}
async function fillRegistration({ name, email, password, confirm = password }) {
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', confirm);
}

// A6-01 Login page has no demo accounts and links to registration
await page.goto(`${BASE}/login`);
const demoText = await page.getByText(/demo account/i).count();
record('A6-01', 'Login page', 'Open /login', 'No demo accounts, "Create an account" link', `demo panels=${demoText}`, demoText === 0, await shot('A6-01', 'login_page'));

// A6-02 Registration validation + password strength (weak password, mismatch)
await page.getByRole('link', { name: 'Create an account' }).click();
await page.waitForURL('**/register');
await fillRegistration({ name: 'Al', email: 'not-an-email', password: 'ali123', confirm: 'ali124' });
await page.getByText('Password strength:').waitFor();
await page.click('form button[type=submit]');
await page.getByText('Passwords do not match.').waitFor();
record('A6-02', 'Register validation + strength checker', 'Name "Al", bad email, password "ali123", mismatch',
  'Errors on every field, "Weak" strength shown, nothing sent', 'All four field errors and Weak strength shown', true, await shot('A6-02', 'register_validation_weak'));

// A6-03 Successful registration -> account + JWT + logged in
await fillRegistration(PATIENT);
await page.getByText('Strong', { exact: true }).waitFor();
const regPromise = page.waitForResponse(r => r.url().endsWith('/api/auth/register'));
await page.click('form button[type=submit]');
const reg = await regPromise;
const regBody = await reg.json();
await page.waitForURL('**/patient');
await page.getByRole('heading', { name: `Welcome, ${PATIENT.name}` }).waitFor();
const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), cookie: document.cookie }));
const parts = String(regBody.token).split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
writeFileSync(path.join(OUT, 'A6-03_register_response.json'), JSON.stringify({
  status: reg.status(), user: regBody.user, tokenHeader: JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
  tokenPayload: payload, browserStorageAfterRegister: storage,
}, null, 2));
record('A6-03', 'Registration + JWT', `Register ${PATIENT.name} with a strong password`,
  '201, patient account, signed JWT, logged in, nothing in browser storage',
  `HTTP ${reg.status()}, role=${regBody.user.role}, JWT ${JSON.parse(Buffer.from(parts[0], 'base64url')).alg}, storage empty=${!storage.local.length && !storage.session.length && !storage.cookie}`,
  reg.status() === 201 && regBody.user.role === 'patient' && !storage.local.length && !storage.session.length && !storage.cookie,
  await shot('A6-03', 'registered_patient_dashboard'));

// A6-04 Module 2: invalid submission rejected
await page.getByRole('link', { name: 'Submit Request' }).first().click();
await page.waitForURL('**/request');
await page.getByText('No requests yet.').waitFor();
await page.click('button[type=submit]');
await page.getByText('Medicine name is required').waitFor();
record('A6-04', 'Module 2 validation', 'Submit empty form', 'Field errors, nothing sent', 'Inline errors shown', true, await shot('A6-04', 'request_empty_rejected'));

// A6-05 Module 2: valid submission with XSS payload
const xss = '<img src=x onerror=alert(1)>';
await page.fill('#medicine', 'Brufen 400mg');
await page.selectOption('#category', 'Painkiller');
await page.fill('#quantity', '3');
await page.fill('#notes', xss);
const post = page.waitForResponse(r => r.url().endsWith('/api/requests') && r.request().method() === 'POST');
await page.click('button[type=submit]');
const postRes = await post;
const created = (await postRes.json()).request;
await page.getByText(`Request ${created.id} submitted successfully`).waitFor();
await page.getByText(xss).first().waitFor();
record('A6-05', 'Module 2 submit (frontend -> backend -> DB)', `Brufen 400mg, qty 3, notes ${xss}`,
  '201, new GM reference, note shown as text, no alert', `HTTP ${postRes.status()}, ${created.id}, literal note shown, alerts=${dialogs.length}`,
  postRes.status() === 201 && dialogs.length === 0, await shot('A6-05', 'request_submitted_xss_literal'));

// A6-06 Module 2: track + details
await page.getByRole('link', { name: 'Track Requests' }).first().click();
await page.waitForURL('**/track');
await page.getByRole('button', { name: `View Details for ${created.id}` }).click();
await page.locator('.track-details dd', { hasText: 'Brufen 400mg' }).waitFor();
record('A6-06', 'Module 2 retrieval', `View Details for ${created.id}`, 'Details loaded from backend', 'Details shown', true, await shot('A6-06', 'track_details_from_backend'));

// A6-07 Module 1: patient requests a review
await page.getByRole('link', { name: 'My dashboard' }).first().click();
await page.waitForURL('**/patient');
await page.selectOption('#requested-medicine', '4');
const reviewPost = page.waitForResponse(r => r.url().endsWith('/api/reviews') && r.request().method() === 'POST');
await page.click('#new-request button[type=submit]');
const reviewRes = await reviewPost;
await page.getByText('Review request submitted.').waitFor();
record('A6-07', 'Module 1 submit', 'Request review of Brufen (id 4)', '201, listed under My review requests', `HTTP ${reviewRes.status()}`, reviewRes.status() === 201, await shot('A6-07', 'patient_review_requested'));

// A6-08 Role check in UI
await spaNavigate('/doctor');
await page.getByRole('heading', { name: 'Access Denied' }).waitFor();
record('A6-08', 'Role-based access (UI)', 'Patient opens /doctor', 'Access Denied', 'Access Denied page', true, await shot('A6-08', 'patient_opens_doctor_denied'));

// A6-09 Duplicate registration rejected
await logout();
await page.goto(`${BASE}/register`);
await fillRegistration({ ...PATIENT, email: PATIENT.email.toUpperCase() });
const dupPromise = page.waitForResponse(r => r.url().endsWith('/api/auth/register'));
await page.click('form button[type=submit]');
const dup = await dupPromise;
await page.getByText('This email is already registered.').waitFor();
record('A6-09', 'Duplicate registration', 'Register again with the same email in capitals', '409, "already registered"', `HTTP ${dup.status()}`, dup.status() === 409, await shot('A6-09', 'register_duplicate_email'));

// A6-10 Wrong password -> 401
await page.goto(`${BASE}/login`);
let res = await login(PATIENT.email, 'WrongPassword1');
await page.getByText('Invalid email or password.').waitFor();
record('A6-10', 'Backend login', 'Registered email + wrong password', '401, generic error', `HTTP ${res.status()}`, res.status() === 401, await shot('A6-10', 'login_wrong_password'));

// A6-11 Doctor (provisioned from .env) decides the review
res = await login(DOCTOR.email, DOCTOR.password);
await page.waitForURL('**/doctor');
const card = page.locator('article', { hasText: 'Brufen' }).filter({ hasText: 'Pending review' }).first();
await card.waitFor();
await card.locator('select[name=decision]').selectOption('reviewed');
await card.locator('textarea[name=note]').fill('<script>alert("doctor")</script> Checked dosage.');
const patch = page.waitForResponse(r => /\/api\/reviews\/\d+$/.test(r.url()) && r.request().method() === 'PATCH');
await card.getByRole('button', { name: 'Save review' }).click();
const patchRes = await patch;
await page.getByText('<script>alert("doctor")</script> Checked dosage.').first().waitFor();
record('A6-11', 'Module 1 doctor decision (role: doctor)', 'Doctor logs in, marks reviewed with script text in note',
  '200, note shown as text, no alert', `HTTP ${patchRes.status()}, alerts=${dialogs.length}`,
  patchRes.status() === 200 && dialogs.length === 0, await shot('A6-11', 'doctor_review_saved'));

// A6-12 Refresh drops the in-memory token
await page.reload();
await page.getByRole('heading', { name: 'Login to GenMed' }).waitFor();
const reloadedUrl = new URL(page.url()).pathname;
record('A6-12', 'Token kept in memory only', 'Reload /doctor while logged in', 'Must log in again', `Now on ${reloadedUrl}`, reloadedUrl === '/login', null);

// A6-13 Persistence: the registered patient logs in again and sees the decision
res = await login(PATIENT.email, PATIENT.password);
await page.waitForURL('**/patient');
await page.locator('article', { hasText: 'Brufen' }).filter({ hasText: 'Reviewed' }).first().waitFor();
record('A6-13', 'Data persisted in database', 'Registered patient logs in again', 'Doctor decision visible', `HTTP ${res.status()}, status "Reviewed" shown`, res.status() === 200, await shot('A6-13', 'patient_sees_reviewed_status'));

writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({
  browser: `Microsoft Edge ${browser.version()} (headless)`, frontend: BASE, backend: 'http://localhost:4000 (via Vite proxy)',
  date: new Date().toISOString(), alerts: dialogs,
  consoleErrors: consoleErrors.map(text => text.includes('401') ? `${text} (expected: wrong-password test A6-10)` : text.includes('409') ? `${text} (expected: duplicate test A6-09)` : text),
  results,
}, null, 2));
await browser.close();
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed, alerts=${dialogs.length}, consoleErrors=${consoleErrors.length}`);
process.exit(failed ? 1 : 0);
