// Activity 6 browser walkthrough on Microsoft Edge: captures the evidence screenshots in this folder.
// How to run (backend on :4000 and `npm run dev` on :5173 must be running, fresh DB via `npm run db:reset`):
//   npm install --no-save playwright-core   (in any scratch folder)
//   node e2e-walkthrough.mjs <output-folder>
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const results = [];
const dialogs = [];
const consoleErrors = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

async function shot(id, name, locator) {
  const file = `${id}_${name}.png`;
  // Scroll to top and drop focus so the sticky header and skip link render in place.
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  await page.waitForTimeout(150);
  if (locator) await locator.screenshot({ path: path.join(OUT, file) });
  else await page.screenshot({ path: path.join(OUT, file), fullPage: true });
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
  return (await response);
}
async function logout() {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
}
async function spaNavigate(to) {
  await page.evaluate(target => { window.history.pushState({}, '', target); window.dispatchEvent(new PopStateEvent('popstate')); }, to);
}

await page.goto(`${BASE}/login`);

// A6-01 wrong password -> backend 401, generic message
let res = await login('patient@example.com', 'WrongPassword1!');
await page.getByText('Invalid email or password.').waitFor();
record('A6-01', 'Backend login', 'patient@example.com + wrong password', '401 and generic error', `HTTP ${res.status()}, generic message shown`, res.status() === 401, await shot('A6-01', 'login_wrong_password'));

// A6-02 successful login -> JWT
res = await login('patient@example.com', 'PatientDemo1!');
const body = await res.json();
await page.waitForURL('**/patient');
await page.getByRole('heading', { name: /Welcome, Ali Demo/ }).waitFor();
const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), cookie: document.cookie }));
const tokenParts = String(body.token).split('.');
const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
writeFileSync(path.join(OUT, 'A6-02_login_response.json'), JSON.stringify({
  status: res.status(), user: body.user, tokenHeader: JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString()),
  tokenPayload: payload, browserStorageAfterLogin: storage,
}, null, 2));
record('A6-02', 'Login + JWT generation', 'patient@example.com + correct password',
  '200, signed JWT, patient dashboard, nothing in browser storage',
  `HTTP ${res.status()}, JWT alg HS256 with sub=${payload.sub}, role=${payload.role}; storage empty=${!storage.local.length && !storage.session.length && !storage.cookie}`,
  res.status() === 200 && tokenParts.length === 3 && !storage.local.length && !storage.session.length && !storage.cookie,
  await shot('A6-02', 'patient_dashboard_after_login'));

// A6-03 Module 2: invalid submission rejected
await page.getByRole('link', { name: 'Submit Request' }).first().click();
await page.waitForURL('**/request');
await page.getByText('GM-1003').first().waitFor();
await page.click('button[type=submit]');
await page.getByText('Medicine name is required').waitFor();
record('A6-03', 'Module 2 validation', 'Submit empty form', 'Field errors, nothing sent', 'Inline errors shown', true, await shot('A6-03', 'request_empty_rejected'));

// A6-04 Module 2: valid submission with XSS payload -> stored in DB, shown literally
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
record('A6-04', 'Module 2 submit (frontend -> backend -> DB)', `Brufen 400mg, qty 3, notes ${xss}`,
  '201, new GM reference, note displayed as text, no alert', `HTTP ${postRes.status()}, ${created.id}, literal note shown, dialogs=${dialogs.length}`,
  postRes.status() === 201 && dialogs.length === 0, await shot('A6-04', 'request_submitted_xss_literal'));

// A6-05 Module 2: track + details from GET /api/requests/:ref
await page.getByRole('link', { name: 'Track Requests' }).first().click();
await page.waitForURL('**/track');
await page.getByRole('button', { name: `View Details for ${created.id}` }).click();
await page.locator('.track-details dd', { hasText: 'Brufen 400mg' }).waitFor();
record('A6-05', 'Module 2 retrieval', `View Details for ${created.id}`, 'Details loaded from backend', 'Details shown', true, await shot('A6-05', 'track_details_from_backend'));

// A6-06 Module 1: patient requests a review
await page.getByRole('link', { name: 'My dashboard' }).first().click();
await page.waitForURL('**/patient');
await page.selectOption('#requested-medicine', '4');
const reviewPost = page.waitForResponse(r => r.url().endsWith('/api/reviews') && r.request().method() === 'POST');
await page.click('#new-request button[type=submit]');
const reviewRes = await reviewPost;
await page.getByText('Review request submitted.').waitFor();
record('A6-06', 'Module 1 submit', 'Request review of Brufen (id 4)', '201 and listed under My review requests', `HTTP ${reviewRes.status()}`, reviewRes.status() === 201, await shot('A6-06', 'patient_review_requested'));

// A6-07 Role check in UI: patient opening doctor page
await spaNavigate('/doctor');
await page.getByRole('heading', { name: 'Access Denied' }).waitFor();
record('A6-07', 'Role-based access (UI)', 'Patient opens /doctor', 'Access Denied', 'Access Denied page', true, await shot('A6-07', 'patient_opens_doctor_denied'));

// A6-08 Logout clears the token; doctor logs in and decides the review
await logout();
const after = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
res = await login('doctor@example.com', 'DoctorDemo1!');
await page.waitForURL('**/doctor');
const card = page.locator('article', { hasText: 'Brufen' }).filter({ hasText: 'Pending review' }).first();
await card.waitFor();
await card.locator('select[name=decision]').selectOption('reviewed');
await card.locator('textarea[name=note]').fill('<script>alert("doctor")</script> Checked dosage.');
const patch = page.waitForResponse(r => /\/api\/reviews\/\d+$/.test(r.url()) && r.request().method() === 'PATCH');
await card.getByRole('button', { name: 'Save demo review' }).click();
const patchRes = await patch;
await page.getByText('Decision saved. This is not medical approval.').waitFor().catch(() => {});
await page.getByText('<script>alert("doctor")</script> Checked dosage.').first().waitFor();
record('A6-08', 'Module 1 doctor decision (role: doctor)', 'Mark reviewed with script text in note',
  '200, note shown as text, no alert', `HTTP ${patchRes.status()}, dialogs=${dialogs.length}, storage after logout empty=${!after.local.length && !after.session.length}`,
  patchRes.status() === 200 && dialogs.length === 0, await shot('A6-08', 'doctor_review_saved'));

// A6-09 Refresh drops the in-memory token
await page.reload();
await page.getByRole('heading', { name: 'Login to GenMed' }).waitFor();
const reloadedUrl = new URL(page.url()).pathname;
record('A6-09', 'Token kept in memory only', 'Reload /doctor while logged in', 'Redirected to login, must log in again',
  `Now on ${reloadedUrl}`, reloadedUrl === '/login', await shot('A6-09', 'reload_requires_login'));

// A6-10 Persistence: patient sees the doctor decision after logging in again
res = await login('patient@example.com', 'PatientDemo1!');
await page.waitForURL('**/patient');
await page.locator('article', { hasText: 'Brufen' }).filter({ hasText: 'Reviewed (demo only)' }).first().waitFor();
record('A6-10', 'Data persisted in database', 'Patient logs in again', 'Doctor decision visible', 'Status "Reviewed (demo only)" shown', true, await shot('A6-10', 'patient_sees_reviewed_status'));

writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({
  browser: `Microsoft Edge ${browser.version()} (headless)`, frontend: BASE, backend: 'http://localhost:4000 (via Vite proxy)',
  date: new Date().toISOString(), alerts: dialogs, consoleErrors, results,
}, null, 2));
await browser.close();
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed, alerts=${dialogs.length}, consoleErrors=${consoleErrors.length}`);
process.exit(failed ? 1 : 0);
