# Development Activity 6: Backend Development and Integration

Project: GenMed (Pakistan) · Branch: `activity6-backend`
Group: Muhammad Aamir (23F-3073), Ammar Ahmad (23P-3071)

Stack: Node.js + Express 5, SQLite (`node:sqlite`), `jsonwebtoken` (HS256) and `bcryptjs`.
Setup steps, database tables, every API endpoint and the security controls are documented in
[`backend/README.md`](../../backend/README.md).

## Module ownership

| Member | Module | Backend | Frontend integration |
| --- | --- | --- | --- |
| Muhammad Aamir | **Module 1**: accounts (registration, login with JWT) and medicine review requests | `routes/auth.js`, `routes/reviews.js`, `middleware/auth.js` | `context/AuthContext.jsx`, `pages/Register.jsx`, `pages/Login.jsx`, `pages/PatientDashboard.jsx`, `pages/DoctorDashboard.jsx` |
| Ammar Ahmad | **Module 2**: submit, view and track medicine requests | `routes/requests.js`, `validation.js` (request rules) | `pages/RequestMedicine.jsx`, `pages/TrackRequests.jsx`, `components/RequestStatusManager.jsx` (doctor status panel) |

Both modules run in the same Express app and use the same SQLite database and the same JWT
middleware.

## What changed in the frontend

- **Real accounts instead of demo accounts.** The demo account panel and all bundled credentials were removed. Anyone can create a patient account on the new **Register** page (`/register`), which logs them in straight away.
- The Activity 5 password strength checker (`checkPasswordStrength`) now runs on the Register page, the registration form in the project. The server separately enforces a password policy of 8–128 characters with uppercase, lowercase and a number.
- Public sign-up always creates a **patient**. The doctor account is created by the administrator from `.env`, so nobody can give themselves doctor permissions.
- A new database has no sample patients or records. The automated tests use their own in-memory data.
- **The medicine catalogue comes from the backend.** The hardcoded `src/data/medicines.js` was deleted. Search, the patient dashboard's medicine list and the review cards load it from `GET /api/medicines` (the SQLite `medicines` table) through `services/medicineCatalog.js`, with loading and error messages.
- **Doctor medicine request panel (Module 2).** The doctor dashboard has a "Medicine requests" section listing all patients' requests (`GET /api/requests`), with a status control that calls `PATCH /api/requests/:reference/status`. The patient sees the new status on Track Requests.
- The mock stores were removed. All data comes from the API through `services/api.js` and the `api()` helper in `AuthContext`, which attaches the JWT.
- The JWT is kept only in React memory, never in localStorage, sessionStorage or cookies. Any 401 response logs the user out.
- Forms validate in the browser first (Activity 5), then show the server's field errors if the server rejects the input. A test checks that the browser and server rules give identical results.
- "Demo" and "fictional" wording was removed from the pages. The notice that catalogue prices are samples, not verified DRAP data, was kept because it is accurate.

## Test results

- `backend: npm test`: **38/38 passed**, against the real Express app on a random port with an in-memory SQLite database. This includes 9 registration tests and a test that the catalogue is served from the database.
- `frontend: npm test`: **56/56 passed**, `npm run lint` is clean and `npm run build` succeeds.
- The browser walkthrough on Microsoft Edge 157 (`activity6-evidence/e2e-walkthrough.mjs`) passed **16/16** on a fresh database, with 0 script alerts. The 2 console entries are the browser's own logs of the expected 409 (A6-09) and 401 (A6-10) responses. The screenshots and `results.json` are in `activity6-evidence/`.

### Requirement coverage (Tasks 1-5 and submission)

| Requirement | Where |
| --- | --- |
| T1 Backend server + database connectivity | Express 5 (`backend/src/server.js`, `app.js`), SQLite via `node:sqlite` (`db.js`). `GET /api/health` confirms the connection |
| T1 Tables for the modules, store and retrieve | `backend/database/schema.sql`: `users`, `medicines`, `review_requests` (Module 1), `medicine_requests` (Module 2) |
| T2 Insert / retrieve / routes / success and failure handling | Module 1: `POST`, `GET`, `PATCH /api/reviews`. Module 2: `POST`, `GET`, `GET /:reference`, `PATCH /:reference/status` on `/api/requests`. JSON `{ ok, message, errors }` with 400/401/403/404/409/429/500 |
| T3 No hardcoded or mock data | Requests, reviews, accounts and the medicine catalogue all come from the API. `src/data/medicines.js` and the mock stores were removed |
| T3 Success and failure messages | Inline field errors from the server, success messages with the new reference, and a network error message if the backend is down (`services/api.js`) |
| T4 Login, hashing, JWT, verification | `routes/auth.js` (bcrypt cost 12), `middleware/auth.js` (HS256, pinned algorithm, issuer, audience, expiry) |
| T5 Roles, validation, SQL injection, safe errors | `requireRole()`, `validation.js`, prepared statements only, generic 500 handler in `errors.js` |
| Submission 2: database setup script | `backend/database/schema.sql`, plus `npm run db:reset` |
| Submission 3: API endpoint details | `backend/README.md` › API endpoints |
| Submission 4-6: evidence | This file, `activity6-evidence/` (screenshots and `results.json`), and the automated tests |

### Task 6 demonstration checklist

| # | Requirement | Evidence |
| --- | --- | --- |
| 1 | Successful login and JWT generation | A6-03 (registration returns a JWT) and `A6-03_register_response.json` (HS256 header, payload `sub`/`role`/`iss`/`aud`/`exp`, browser storage empty). A6-13 (login). Test: `auth.test.mjs › successful login returns a signed HS256 JWT` |
| 2 | Protected endpoint with a valid token | A6-05 and A6-06 (requests created and loaded with the token). Test: `protected endpoint works with a valid token` |
| 3 | Invalid or missing token rejected | Test: `missing, malformed, tampered, re-signed, alg:none and expired tokens are rejected` (all 401). Manual `curl` check below |
| 4 | Role-based access restrictions | A6-08 (patient opens the doctor page), A6-11 and A6-15 (doctor-only actions). Tests: `ROLE: a patient cannot record a doctor decision (403)`, `SECURITY: a role sent by the client is ignored; sign-up never creates a doctor`, `ROLE: only a doctor can update a request status` |
| 5 | Submission and retrieval through frontend and backend | A6-03 (account saved), A6-05 (submit → `GM-1001`), A6-06 (details from `GET /api/requests/GM-1001`), A6-07 and A6-11 (Module 1 submit and decision), A6-13 (decision still there after logging in again), A6-14 (catalogue from `GET /api/medicines`), A6-15 and A6-16 (Module 2 status saved by the doctor and seen by the patient) |
| 6 | Both modules demonstrated | Module 1: A6-01–A6-03, A6-07, A6-09–A6-11, A6-13. Module 2: A6-04–A6-06, A6-15, A6-16 |

### Browser test cases (Edge, fresh database)

| ID | Feature | Action | Expected | Actual |
| --- | --- | --- | --- | --- |
| A6-01 | Login page | Open `/login` | No demo accounts, link to registration | No demo panel, "Create an account" shown |
| A6-02 | Register validation + strength checker | Name "Al", email "not-an-email", password "ali123", confirmation does not match | Errors on all fields, strength "Weak", nothing sent | 4 field errors, Weak 1/6 |
| A6-03 | Registration + JWT | Register Hamza Tariq with a strong password | 201, patient account, JWT, logged in, no browser storage | 201, role patient, HS256 JWT, storage empty |
| A6-04 | Module 2 validation | Submit an empty form | Field errors | Inline errors shown |
| A6-05 | Module 2 submit | Brufen 400mg, qty 3, notes `<img src=x onerror=alert(1)>` | 201, new reference, note shown as text | 201, GM-1001, literal text, 0 alerts |
| A6-06 | Module 2 retrieval | View Details GM-1001 | Loaded from the backend | Details shown |
| A6-07 | Module 1 submit | Patient requests a review of Brufen | 201 | 201 |
| A6-08 | Role (UI) | Patient opens `/doctor` | Access Denied | Access Denied |
| A6-09 | Duplicate registration | Same email in capitals | 409, "already registered" | 409, message under the email field |
| A6-10 | Backend login | Registered email + wrong password | 401, generic message | 401, "Invalid email or password." |
| A6-11 | Module 1 doctor decision | Doctor (from `.env`) marks reviewed, note containing `<script>` | 200, note shown as text | 200, literal text, 0 alerts |
| A6-12 | Token in memory only | Reload while logged in | Must log in again | Redirected to `/login` |
| A6-13 | Persistence | Registered patient logs in again | Decision visible | "Reviewed" shown |
| A6-14 | Catalogue from backend | Patient searches "Panadol" | Results built from `GET /api/medicines` | 200, 3 options in 1 group |
| A6-15 | Module 2 doctor status update | Doctor sets GM-1001 to Approved | 200, status shown, patient note shown as text | 200, "Status updated to Approved", 0 alerts |
| A6-16 | Module 2 persistence | Patient opens Track Requests | GM-1001 shows Approved | "Approved" shown |

### Manual API checks (curl through the Vite proxy)

| Check | Result |
| --- | --- |
| `GET /api/requests` with no token | `401 {"ok":false,"message":"Authentication required."}` |
| `GET /api/requests` with the last signature character changed | `401 ... "Your session is invalid or has expired. Please log in again."` |
| Patient `PATCH /api/reviews/1` | `403 ... "You do not have permission to perform this action."` |
| `POST /api/requests` with empty medicine, category `X`, quantity `99` | `400` with field errors for all three |
| Login with email `' OR '1'='1' --` | `401 "Invalid email or password."` |
| Doctor `PATCH /api/requests/GM-1005/status {"status":"Approved"}` | `200`, status `Approved` |
| `SELECT ... FROM users` | `password_hash` values start with `$2b$12$` (bcrypt), with no plaintext |
