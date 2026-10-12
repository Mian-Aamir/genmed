# Activity 3 Module 1 and shared foundation

Project: GenMed (Pakistan)

Module 1 owner: Muhammad Aamir (23F-3073).
Module 2 owner: Ammar Ahmad (23P-3071).
Working branch: module1-project-activity-3, created by the user.

## Scope and document reconciliation

The official activity requires two complementary modules and their eventual integration.
The group's submitted document describes both as completed, but this implementation
delivers only the shared foundation and Module 1. Module 2 remains a placeholder.
Do not claim the full Activity 3 integration or Module 2 tests are complete yet.
React routes replace the document's illustrative request.html/track.html files.
Activity 1/2 login, search, Doctor reviews, session handling and tests are preserved.

## Foundation contract for Module 2

Import from src/services/requestStore.js and use the current useAuth().user session.

- STATUSES: Pending, Approved, Dispatched, Delivered.
- CATEGORIES: Painkiller, Antibiotic, Allergy, Stomach/Acid, Other.
- listOwnRequests(session): { ok: true, requests } in newest-first order.
- getOwnRequest(session, id): { ok: true, request } for an owned record.
- addOwnRequest(session, fields): { ok: true, request, message }.
- Failed actions: { ok: false, message }; validation failures also include errors.
- Unauthorized sessions return Access Denied before reading or writing records.
- Unknown and unowned references both return Request not found.
- resetRequestStore(): { ok: true }; resets fixtures and the sequence for tests only.

Record fields are exactly id, ownerId, patientName, medicine, category, quantity,
notes, date, status. Returned records are copies. There are no exported mutable arrays.
The sample owner is the existing demo patient, patient-1 (Ali Demo).
GM-1001 is Delivered, GM-1002 Approved, and GM-1003 Dispatched.
New references start at GM-1004 and status Pending. Dates use Asia/Karachi calendar dates.
The limit is 20 records per patient, including the three initial sample records.
Failed submissions do not consume reference numbers.

Contract assumption: the required no-argument resetRequestStore() is a test-only
lifecycle helper, not a patient action. It has no session argument and is not exposed
in the UI. Every session-taking read/write action checks Patient role and ownership.
Frontend code cannot protect this helper or other bundled code from browser modification.

The store is an in-memory singleton shared by both modules. Navigation and logout
do not erase the fictional records; refresh resets them and the existing demo session.
No localStorage, cookies, database, or backend was added. Module 2 should call the list
function when it renders/mounts; no live subscription is part of this contract.

## File ownership and merge handoff

Foundation files are requestStore.js, App.jsx routes, Navbar.jsx patient links,
PatientDashboard.jsx cards, and tests/request-store.test.mjs. Module 2 must not edit them.
Module 1 owns RequestMedicine.jsx, request.css, requestValidation.js,
tests/request-submit.test.mjs, and this note.
Module 2 owns TrackRequests.jsx and track.css; currently these are placeholders only.

Start Module 2 from the completed foundation branch (or merge it before coding).
Keep requestValidation.js with the foundation because requestStore imports it.
Replace the two placeholders on the teammate's branch; do not independently re-add
shared files from an older main branch. This avoids overlapping ownership, but Git
cannot guarantee conflict-free merges if either branch changes the other's files.

## Module 1 validation and feedback

- Patient Name is read-only and derived from the session, never submitted input.
- Session names must have at least three trimmed characters, matching the group document.
- Medicine is trimmed and must be 3-120 characters; the upper bound limits input size.
- Category is trimmed and checked against CATEGORIES.
- Quantity accepts integer numbers or decimal-digit strings representing 1-20.
- Notes may be omitted or empty; nonempty spaces-only notes are rejected.
- Notes are trimmed for storage, limited to 200 raw characters, and counted live.
- The action repeats validation even when called directly without the form.
- A successful submission clears editable fields, keeps the session name, displays
  Request GM-1004 submitted successfully (using the actual reference), and prepends
  the new Pending record to My Requests.

## Part 6 row for Module 1

Module: Submit Medicine Request.

Possible misuse/problem: empty or spaces-only values, quantity 5000, or HTML/script
text in notes could create invalid records or unsafe output.

Response: trim text, reject missing required fields, allow only predefined categories,
enforce whole-number quantities from 1 to 20, bound notes to 200 characters, and repeat
validation inside addOwnRequest. Display text with React escaping rather than HTML
insertion. Script-like notes remain literal text; no script executes. Derive owner,
patient name, reference, date and status internally rather than trusting submitted fields.

Frontend validation alone is not real security: browser code and session objects can
be modified. The backend will authenticate sessions, revalidate input and enforce
role/record ownership before returning or changing data. Only fictional data belongs
in this prototype. Status samples are not real medical approvals or deliveries.

## Verification performed

- npm test: 35 tests passed, including all seven unchanged Activity 2 tests.
- npm run lint: passed.
- npm run build: passed.
- Browser: checked form errors, references GM-1004/GM-1005, Pending status, newest-first
  list, cleared form, read-only name, 200-character limit, script text escaping,
  placeholder navigation, Doctor denial for both routes, logout/refresh behavior,
  empty browser storage, and layouts from 320 to 1440 pixels.
- Existing medicine search and Patient-to-Doctor review requests worked in the browser.
- No browser console errors or warnings occurred in the successful check.
- Module 2 search/filter/details and live deployment were not implemented or tested.

## Manual checklist

1. Log in with patient@example.com / PatientDemo1! and open Submit Request.
2. Confirm the name is Ali Demo, read-only, and three sample records appear.
3. Submit a valid request: expect GM-1004, Pending, a green banner and cleared inputs.
4. Submit another: expect GM-1005 at the top of the list.
5. Try blank/spaces-only medicine, missing category, and quantities 0, 21, 1.5,
   text and 5000. No new record should be added.
6. Check notes counter and 200-character limit; script-like notes must display literally.
7. Navigate to Track Requests: only Module 2 coming soon appears. Return to Submit Request.
8. Check both new dashboard cards and the Patient-only navbar links on desktop/mobile.
9. Log in as Doctor: new links are absent; both routes deny access under the Doctor session.
10. Log out: protected routes require login. Refresh: session and new requests reset.
11. Recheck Home, login/password toggle, medicine search, Doctor reviews and the 404 page.

Run from D:\genmed\frontend: npm test, npm run lint, npm run build, npm run dev.
