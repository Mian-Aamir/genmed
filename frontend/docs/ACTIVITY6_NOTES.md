# Development Activity 6: Backend Development and Integration

Project: GenMed (Pakistan) · Branch: `activity6-backend`
Group: Muhammad Aamir (23F-3073), Ammar Ahmad (23P-3071)

Stack: Node.js + Express 5, SQLite (`node:sqlite`), `jsonwebtoken` (HS256) and `bcryptjs`.
Setup steps, database tables, every API endpoint and the security controls are documented in
[`backend/README.md`](../../backend/README.md).

## Module ownership

| Member | Module | Backend | Frontend integration |
| --- | --- | --- | --- |
| Muhammad Aamir | **Module 1**: login (JWT) and medicine review requests | `routes/auth.js`, `routes/reviews.js`, `middleware/auth.js` | `context/AuthContext.jsx`, `pages/Login.jsx`, `pages/PatientDashboard.jsx`, `pages/DoctorDashboard.jsx` |
| Ammar Ahmad | **Module 2**: submit, view and track medicine requests | `routes/requests.js`, `validation.js` (request rules) | `pages/RequestMedicine.jsx`, `pages/TrackRequests.jsx` |

Both modules run in the same Express app and use the same SQLite database and the same JWT
middleware.

## What changed in the frontend

- The mock stores were removed. `services/demoService.js` was deleted, and `services/requestStore.js` now holds only constants.
- All data comes from the API through `services/api.js` and the `api()` helper in `AuthContext`, which attaches the JWT.
- Vite proxies `/api` to `http://localhost:4000`, so the browser makes same-origin requests.
- Login is now `async`. The backend verifies the password and returns the JWT, which is kept in a `useRef` in memory only. Any 401 response logs the user out.
- Passwords were removed from the frontend bundle. `data/demoUsers.js` now lists only the seeded emails.
- Forms still validate in the browser (Activity 5) and then show the server's field errors if the server rejects the input.
- Loading, success and failure messages are shown for every request, including "Cannot reach the GenMed server" if the backend is down.

## Test results

- `backend: npm test`: **28/28 passed**, against the real Express app on a random port with an in-memory SQLite database.
- `frontend: npm test`: **53/53 passed**, `npm run lint` is clean and `npm run build` succeeds. The mock-store unit tests were replaced by the backend API tests, and a new test checks that the frontend and backend validation rules give identical results.
- The browser walkthrough on Microsoft Edge 157 (`activity6-evidence/e2e-walkthrough.mjs`) passed **10/10**, with 0 script alerts. The only console entry is the browser's own log of the expected 401 in A6-01. The screenshots and `results.json` are in `activity6-evidence/`.

### Task 6 demonstration checklist

| # | Requirement | Evidence |
| --- | --- | --- |
| 1 | Successful login and JWT generation | A6-02 screenshot and `A6-02_login_response.json` (HS256 header, payload `sub`/`role`/`iss`/`aud`/`exp`, browser storage empty). Test: `auth.test.mjs › successful login returns a signed HS256 JWT` |
| 2 | Protected endpoint with a valid token | A6-04 and A6-05 (requests loaded and created with the token). Test: `protected endpoint works with a valid token` |
| 3 | Invalid or missing token rejected | Test: `missing, malformed, tampered, re-signed, alg:none and expired tokens are rejected` (all 401). Manual `curl` check below |
| 4 | Role-based access restrictions | A6-07 (patient opens the doctor page). Tests: `ROLE: a patient cannot record a doctor decision (403)`, `ROLE: a doctor cannot submit a patient request (403)`, `ROLE: only a doctor can update a request status` |
| 5 | Submission and retrieval through frontend and backend | A6-04 (submit → `GM-1005`), A6-05 (details from `GET /api/requests/GM-1005`), A6-06 and A6-08 (Module 1 submit and decision), A6-10 (decision still there after logging in again) |
| 6 | Both modules demonstrated | Module 1: A6-01, A6-02, A6-06, A6-08, A6-10. Module 2: A6-03, A6-04, A6-05 |

### Browser test cases (Edge)

| ID | Feature | Action | Expected | Actual |
| --- | --- | --- | --- | --- |
| A6-01 | Backend login | Wrong password | 401, generic message | 401, "Invalid email or password." |
| A6-02 | Login + JWT | Correct patient password | 200, JWT, dashboard, no browser storage | 200, HS256 JWT, storage empty |
| A6-03 | Module 2 validation | Submit an empty form | Field errors | Inline errors shown |
| A6-04 | Module 2 submit | Brufen 400mg, qty 3, notes `<img src=x onerror=alert(1)>` | 201, new reference, note shown as text | 201, GM-1005, literal text, 0 alerts |
| A6-05 | Module 2 retrieval | View Details GM-1005 | Loaded from the backend | Details shown |
| A6-06 | Module 1 submit | Patient requests a review of Brufen | 201 | 201 |
| A6-07 | Role (UI) | Patient opens `/doctor` | Access Denied | Access Denied |
| A6-08 | Module 1 doctor decision | Mark reviewed, note containing `<script>` | 200, note shown as text | 200, literal text, 0 alerts |
| A6-09 | Token in memory only | Reload while logged in | Must log in again | Redirected to `/login` |
| A6-10 | Persistence | Patient logs in again | Decision visible | "Reviewed (demo only)" shown |

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
