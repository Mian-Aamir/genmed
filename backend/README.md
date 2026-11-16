# GenMed backend (Development Activity 6)

Express 5 + SQLite (Node's built-in `node:sqlite`) + JWT. It serves the existing React
frontend in `../frontend` and replaces the in-memory mock data from Activities 1–5.

| Part | Owner | Files |
| --- | --- | --- |
| Shared foundation: server, database, config, errors, JWT middleware | Both members | `src/app.js`, `src/server.js`, `src/db.js`, `src/config.js`, `src/errors.js`, `src/middleware/auth.js`, `database/schema.sql` |
| **Module 1**: authentication and medicine review requests | Muhammad Aamir (23F-3073) | `src/routes/auth.js`, `src/routes/reviews.js`, `tests/auth.test.mjs`, `tests/reviews.test.mjs` |
| **Module 2**: submit, view and track medicine requests | Ammar Ahmad (23P-3071) | `src/routes/requests.js`, `tests/requests.test.mjs` |
| Server-side validation (shared by both modules) | Both members | `src/validation.js` |

## Run it

Requires Node.js 22.13 or later (tested on 26.13.1). There is no separate database server to install.

```bash
# Terminal 1: backend on http://localhost:4000
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET and the DOCTOR_* values (see the comments in the file)
npm run db:reset            # creates an empty data/genmed.db from database/schema.sql
npm start

# Terminal 2: frontend on http://localhost:5173 (Vite proxies /api to the backend)
cd frontend
npm install
npm run dev
```

If `JWT_SECRET` is missing, the server generates a random one for that run and prints a
warning. Logins then stop working after a restart.

`npm test` runs 37 API tests against an in-memory database.

## Accounts

A new database contains **no accounts and no sample records**, only the medicine catalogue.

- **Patients register themselves** on the website: open `/register`, or click **Register** in the navigation bar or **Create an account** on the login page. Registration creates the account and logs the user in straight away.
- **The doctor account is created by the administrator.** Public sign-up can never create a doctor, because otherwise anyone could give themselves doctor permissions. When the server starts, it creates the doctor from `DOCTOR_NAME`, `DOCTOR_EMAIL` and `DOCTOR_PASSWORD` in `.env` if that email does not exist yet. If these are not set, the server prints a warning.

Passwords must be 8–128 characters with an uppercase letter, a lowercase letter and a number,
and must not contain the email name. The same rules are checked in the browser and on the
server. Only bcrypt hashes (cost 12) are stored.

The automated tests use their own in-memory database with fictional accounts (`TEST_ACCOUNTS`
in `src/db.js`). Those accounts never appear in the real database.

## Database

The setup script is `database/schema.sql`. There are four tables:
- `users`: name, unique email, bcrypt `password_hash`, and a role of `patient` or `doctor`.
- `medicines`: the sample catalogue.
- `review_requests`: **Module 1**. Columns include patient, medicine, status `pending/reviewed/discussion`, the internal note and `reviewed_by`.
- `medicine_requests`: **Module 2**. Columns include owner, medicine, category, quantity, notes, status `Pending/Approved/Dispatched/Delivered` and the request date. Public references are `GM-<id>`, starting at `GM-1001`.

`CHECK` constraints repeat the main validation rules, such as allowed roles, statuses and
categories, and the length and quantity limits. The database file is `data/genmed.db`, which
git ignores. Recreate it at any time with `npm run db:reset`.

## API endpoints

All responses are JSON: `{ ok: true, ... }` on success and `{ ok: false, message, errors? }` on failure.
"Auth" means the request needs an `Authorization: Bearer <JWT>` header.

| Method | Path | Auth / role | Module | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | none | shared | Server and database status |
| GET | `/api/medicines` | none | shared | Sample medicine catalogue |
| POST | `/api/auth/register` | none | 1 | `{ name, email, password }` → 201 `{ token, user }`. Always creates a **patient** and ignores any `role` field. 400 with field errors, 409 if the email is taken, 429 after 10 sign-ups per device in 10 minutes |
| POST | `/api/auth/login` | none | 1 | `{ email, password }` → `{ token, user: { id, name, role } }`. 401 on bad credentials, 429 after 5 failures (30 s lock) |
| GET | `/api/auth/me` | any role | 1 | The user behind the token |
| GET | `/api/reviews` | patient, doctor | 1 | A patient gets only their own requests, with no internal notes. A doctor gets all requests with masked email and notes |
| POST | `/api/reviews` | **patient** | 1 | `{ medicineId }` → 201. 409 on a duplicate pending request or the 20-request limit |
| PATCH | `/api/reviews/:id` | **doctor** | 1 | `{ decision: reviewed\|discussion, note }`. A patient gets 403 |
| GET | `/api/requests` | patient, doctor | 2 | A patient gets only their own requests, newest first. A doctor gets all |
| GET | `/api/requests/:reference` | patient, doctor | 2 | For example `GM-1002`. Another patient's reference returns 404, the same as a missing one |
| POST | `/api/requests` | **patient** | 2 | `{ medicine, category, quantity, notes }` → 201 with the new `GM-` reference. 400 with field errors |
| PATCH | `/api/requests/:reference/status` | **doctor** | 2 | `{ status: Pending\|Approved\|Dispatched\|Delivered }`. A patient gets 403 |

Status codes used: `400` invalid input, `401` missing, invalid, modified or expired token,
`403` wrong role, `404` not found, `409` conflict or limit reached, `429` too many login
attempts, `500` generic server error.

## Security controls (Activity 6 Tasks 4–5)

- **Password hashing:** bcrypt with cost 12. Plaintext passwords are never stored or logged. Unknown emails are compared against a dummy hash so they take about as long as wrong passwords, and both get the same generic 401.
- **JWT:** signed with HS256. The token holds only `sub` (user id) and `role`, and sets `iss`, `aud` and a 1 hour `exp`. Verification pins the algorithm (`alg: none` and algorithm-swapping tokens are refused) and checks the issuer, audience and expiry. Missing, malformed, modified, re-signed and expired tokens all get 401. After verification the user is re-loaded from the database, so authorization uses the current role.
- **Secret handling:** `JWT_SECRET` comes from `.env`, which git ignores. There is no hardcoded fallback, and the placeholder value from `.env.example` is rejected.
- **Registration:** the role is fixed to `patient` on the server, so privilege escalation through sign-up is impossible. The name, email and password policy are validated on the server, emails are unique regardless of letter case, and sign-ups are rate limited per client address.
- **Role-based authorization:** `requireRole()` protects every mutation. Patients cannot record review decisions or change request status, and doctors cannot submit patient requests.
- **Ownership:** patient queries are always scoped by the user id from the token, never by an id in the request body or URL. Fields such as `ownerId`, `status`, `date` and `patientName` sent in the body are ignored.
- **Server-side validation:** `src/validation.js` trims input, applies length limits, allowlists categories, statuses and decisions, accepts quantity only as a whole number from 1 to 20, and applies a character pattern to medicine names. A test checks that these rules match the frontend's Activity 5 rules.
- **SQL injection:** every query is a prepared statement with `?` placeholders. User input is never concatenated into SQL, and tests confirm that injection payloads are stored as plain text or rejected.
- **Safe errors:** one generic 500 message. Stack traces, SQL and paths go only to the server log. Malformed JSON gets a plain 400, and `X-Powered-By` is removed.
- **Other hardening:** 10 KB JSON body limit, `nosniff`, `X-Frame-Options: DENY`, a restrictive CSP and `Cache-Control: no-store`. The server listens on localhost only, CORS allows only the Vite dev origin, and login is throttled per email and client address.
- **Frontend token storage:** the JWT is kept only in React memory, not in localStorage, sessionStorage or cookies, which keeps the Activity 5 Task 4 rule. A page refresh or logout drops the token.

### Known limitations (classroom scope)

- JWTs are stateless. Logout discards the token in the browser, but a copied token stays valid until it expires (1 hour). A production system would add a server-side denylist or short-lived tokens with refresh tokens.
- Login and registration throttling are kept in memory and reset when the server restarts.
- Registration tells the user when an email is already registered. This is friendlier, but it lets someone check whether an email has an account. A production system would send a confirmation email instead.
- There is no email verification or password reset yet.
- The selected supporting document (Activity 5 Task 3) is still validated only in the browser and is not uploaded.
