# GenMed Development Activity 2

This update implements SSD Development Activity 2 in the existing React/Vite project. It extends the Activity 1 medicine finder with two roles from the original proposal. No backend, database, UI library, or additional npm dependency was added.

## Selected roles and functions

Patient — Ali Demo:
1. Search medicines and compare matching sample formulations/prices.
2. Submit a medicine review request.
3. View only their own requests and track review status.

Doctor — Dr Sara Demo:
1. View the fictional review queue with masked contact details.
2. Filter pending, reviewed, and needs-discussion requests.
3. Record a demo decision and an internal note on a pending request.

Restricted function: Save a review decision/internal note.
Authorized role: Doctor only.
Security-aware display: Internal notes are omitted from Patient snapshots. Doctor contact displays use masked email addresses. All records are fictional, and real data would require server-side protection.

## Public classroom accounts

- Patient: `patient@example.com` / `PatientDemo1!`
- Doctor: `doctor@example.com` / `DoctorDemo1!`

These pairs are deliberately public test credentials, not real passwords or secrets. They are shown on the Login page for offline demonstrations. There is no role dropdown. Arbitrary credentials fail with a generic message. Registration from Activity 1 is deferred rather than creating unverified accounts or privileged roles.

## Run and verify

```powershell
Set-Location D:\genmed\frontend
npm run dev
```

In a second terminal:

```powershell
Set-Location D:\genmed\frontend
npm test
npm run lint
npm run build
```

For a fresh checkout only, run `npm ci` in frontend before those commands. No package installation is needed for the current workspace.

## Activity requirements and implementation

1. Two roles: Patient and Doctor, from the GenMed proposal.
2. Three functions per role: listed above and implemented in the separate workspaces.
3. Demo users: frontend/src/data/demoUsers.js.
4. Functional credential login: Login.jsx plus demoService.login; credentials resolve the role.
5. Separate dashboards: /patient and /doctor. /dashboard routes by the active role.
6. Different interfaces: Patient has medicine search/request/status tools; Doctor has review/filter/note tools.
7. Restricted operation: demoService.decideReview rejects a non-Doctor before any mutation.
8. Limited data: snapshot projections omit internal notes for Patients and mask contact details for Doctors.
9. Logout: clears current identity, returns to /login, clears the exposed request view, and denies subsequent actions.
10. Tests: seven Node service tests plus browser workflow checks.
11. Security development note: below and in SECURITY_NOTES.md.

## Testing completed locally on 5 October 2026

- Correct role: Patient credentials opened /patient, with only the patient's own requests.
- Different role: Doctor credentials opened /doctor, with the review queue and Doctor-only controls.
- Restricted function: direct service calls from the Patient/anonymous state returned Access Denied without changing records. Wrong-role routes also displayed Access Denied in browser tests.
- Logout: active identity and visible request data were cleared; Login appeared and Back did not restore protected access.
- Workflow: Patient created a request, Doctor saved a demo decision, and Patient saw the updated status after switching accounts in the same tab.
- Data display: Patient views contained no internal notes or other patient's record. Doctor contact fields were masked.
- Input checks: unknown credentials, invalid IDs/decisions, duplicate pending requests, repeat decisions, blank/oversized notes, and request limits were rejected.
- HTML-like notes were displayed literally rather than interpreted as markup.
- Five failures triggered the cooldown; service tests verified the full 30-second boundary and successful recovery. Browser tests verified the disabled form and persistence across navigation.
- Refresh cleared the session and reset demo records. Local/session storage and cookies remained empty during browser checks.
- Login, Patient, and Doctor layouts had no horizontal overflow at 320, 390, 768, and 1440 pixels. Mobile logout worked.
- Browser tests reported no console errors or warnings. Build, lint, and all seven service tests passed.

These are local automated checks, not a claim of a public deployment or a peer usability test.

## Security development note

Security concepts applied: role-based access control, least privilege, fail-safe defaults, ownership checks, data minimization, input validation, and output escaping.

Where applied: ProtectedRoute, the in-memory demoService actions, role-specific snapshot projections, Login, and the two dashboards.

What changed: Arbitrary-input demo entry was replaced with exact matches for two public demo users. Roles are fixed by account. Routes and actions check role independently. Internal notes are excluded from Patient data. Patient contacts are masked in Doctor views.

Unauthorized operation: the action returns `Access Denied` before modifying state. A user visiting a wrong-role dashboard sees an Access Denied page with a link back to their own dashboard.

Limitation: browser code and bundled demo records are inspectable and modifiable. These checks are an educational frontend model, not real security enforcement. Real authentication, authorization, filtering, encryption, and rate limiting belong in the FastAPI backend.

## Short classroom demonstration

1. Open Login and use the Patient account.
2. Open Find medicine, search Panadol, and compare the sample results.
3. Return through My dashboard. Choose Risek and submit a review request.
4. Log out and use the Doctor account in the same browser tab without refreshing.
5. Find the new request, choose a demo decision, add a fictional internal note, and save.
6. Try the queue filters. Observe masked contact addresses.
7. Log out and use the Patient account. The request status changed, but the internal note is absent.
8. Log out and use Back: protected content remains unavailable.
9. Run `npm test` to show the restricted action is denied even when invoked directly as a Patient.

Roman Urdu: Dono roles ko aik hi browser tab mein logout/login karke test karein. Refresh se demo requests reset ho jati hain. Login page par diye gaye accounts hi chalain ge. Patient apna role Doctor nahin bana sakta. Doctor ki note Patient view mein nahin aati, lekin frontend bundle real private information rakhne ki jagah nahin hai.

## Manual retest checklist

- [ ] Test both account pairs and wrong-password/unknown-email failures.
- [ ] Check distinct dashboard navigation and all existing Home/Search/404 links.
- [ ] Submit a request, reject its duplicate, review it as Doctor, then inspect its status as Patient.
- [ ] Verify Patient requests omit Doctor notes and other patients' records.
- [ ] Verify Doctor contact addresses remain masked and all review filters work.
- [ ] Try a blank/oversized note and HTML-like text.
- [ ] Check wrong-role routes, direct action authorization tests, Logout, Back, and refresh.
- [ ] Check five login failures, the countdown, and retry after 30 seconds.
- [ ] Test phone/tablet/desktop layouts, keyboard access, password toggle, and mobile menu.
- [ ] After deploying, refresh /patient, /doctor, /search and confirm SPA routing returns Login instead of a host 404.

## Submission information

Project Name: GenMed (Pakistan) — Generic Medicine Alternative Finder System

Group Members: Muhammad Aamir (23F-3073), Ammar Ahmad (23P-3071)

Live/Local Project: Local Activity 2 implementation in D:\genmed\frontend. The previously supplied public URL is https://genmed-khaki.vercel.app/; this update has not been published or verified there during this task.

Roles Implemented: Patient and Doctor

Restricted Function: Save a medicine review decision and internal note (Doctor only)

Security Concept Applied: Role-based access control, least privilege, ownership checks, data minimization, and input validation; frontend demonstration with backend enforcement planned.

## Hosting

Keep Vercel Root Directory / Netlify Base directory set to frontend, with npm run build and dist as output. Existing SPA rewrites remain in place. Redeploy the updated project before claiming the public URL includes Activity 2. No deployment was performed by this update.
