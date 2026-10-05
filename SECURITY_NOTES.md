# GenMed security notes — Development Activity 2

Hiding UI elements is not a security control. Real enforcement (authentication, role-based access control, input validation, encryption, logging) will be implemented in the FastAPI backend.

## Scope and trust boundary

This is the frontend-only role-aware classroom prototype requested by Activity 2. It has Patient and Doctor roles from the GenMed proposal. It does not authenticate real people, verify medical licenses, or provide clinical approval. All users, prices, requests, notes, and contact details are fictional.

The JavaScript bundle, including its public demo credentials and seeded notes, is downloadable and inspectable. A browser owner can change the code. In-memory role checks and UI data projections demonstrate secure design but do not provide genuine confidentiality or authorization against a hostile client. Never put real credentials, prescriptions, internal notes, or patient details in these fixtures.

## Demo login and session

- Only the two exact public classroom credential pairs in frontend/src/data/demoUsers.js are accepted. Arbitrary valid-looking inputs no longer grant access. These published credentials are intentionally non-secret; they are not an example of production password storage.
- Users cannot choose a role, self-register as a Doctor, or call a public setRole/setUser function. Account roles come from the fixed demo records. Registration is deferred to the backend instead of granting unverified roles.
- Submitted passwords are transient, cleared from the form after submission, and never saved to cookies, localStorage, sessionStorage, logs, or the active user object. Passwords are compared exactly; email case/whitespace is normalized.
- Login failures use `Invalid email or password.` without revealing account existence. Empty and malformed submissions count as failures.
- Five failed submissions disable login for 30 seconds. Navigation and logout do not remove the cooldown. Refresh does, so real rate limiting must be server-side.
- The session contains only ID, display name, and role. Logout clears the identity, returns an empty request projection, redirects to Login, and blocks protected routes/actions. Refresh creates a new demo session.

## Role restrictions and data minimization

- /patient and /search require Patient. /doctor requires Doctor. Unknown roles fail closed. /dashboard directs a signed-in user to the correct workspace.
- requestReview checks the current Patient session and derives ownership internally; callers cannot supply a patient ID or role.
- decideReview checks the current Doctor session before changing a request. Patient/anonymous callers receive `Access Denied`, and no data changes.
- Patient snapshots contain only that patient's requests and explicitly omit internal notes and patient contact fields. Doctor snapshots include internal notes and a masked contact address, not a full address.
- Snapshots are copies. Editing a returned user object's role does not change the service's active identity. These are demonstrations, not substitutes for server-side controls.
- Public demo-account emails on the Login page are intentionally visible and are not real patient contact information.

## Input and output handling

- Medicine IDs must be integers from the known sample list. Pending duplicate requests and more than 20 requests per patient are rejected.
- Only reviewed/discussion decisions are accepted. Missing records, repeat decisions, blank notes, and notes over 300 characters are rejected by the action layer as well as bounded in the UI.
- Untrusted text uses React escaping. No dangerouslySetInnerHTML, eval, credential logging, external UI libraries, or new packages were introduced.
- Shared fictional review records remain in this tab after logout so the second demo role can review a request. All records reset on refresh or a new tab. Draft notes unmount when leaving the Doctor page; real medical data must not use this design.
- Review results explicitly say demo only. Matching medicine formulas and prices do not prove clinical interchangeability.

## Required production controls

The FastAPI backend must authenticate users with properly hashed passwords, provision/verify professional roles, authorize every endpoint and record, derive ownership from the verified session, validate inputs, rate-limit requests, enforce HTTPS, use suitable encryption for sensitive storage, protect session/token handling, and audit sensitive actions without logging passwords. Restricted fields must be filtered on the server before transmission to the browser.

## Verification

`npm test` runs seven service tests, including direct wrong-role mutation attempts, ownership filtering, masked fields, snapshot tampering, logout, cooldown/recovery, and invalid inputs. Browser checks also covered both dashboards, end-to-end request/review/status flow, escaping, navigation, responsive layouts, and absence of credential storage. These checks do not certify production security. Public hosting must be retested after deployment.
