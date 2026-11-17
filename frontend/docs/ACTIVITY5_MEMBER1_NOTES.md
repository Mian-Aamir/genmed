# Activity 5: Member 1, Muhammad Aamir (23F-3073)

Project: GenMed (Pakistan) · Branch: activity5-member1-auth-password
Scope: Task 4 (Sensitive Information Handling), Task 5 (Password Strength Checker) and Login form security.

Files changed: index.html, public/password_strength_helper.js (new), src/pages/Login.jsx,
src/components/PasswordInput.jsx, src/components/PasswordStrengthMeter.jsx (new),
src/context/AuthContext.jsx, src/styles/app.css, tests/password-strength.test.mjs (new).

## Task 5: Password strength checker

- `password_strength_helper.js` is copied unchanged into `public/`, and `index.html` loads it
  with `<script src="/password_strength_helper.js"></script>` before the React app.
- The helper creates a browser global, so the app calls `window.checkPasswordStrength(password)` rather than importing it.
- The Login password field calls the helper on every change. Below the field it shows the
  level, the score (for example 3/6), the helper's message and a 6-part meter.
- Only the returned result is kept in React state, never the password. The feedback is cleared
  together with the password field after every submit. If the script fails to load, a message is shown instead.

| Password | Level | Score | Message |
| --- | --- | --- | --- |
| `ali123` | Weak | 1/6 | Try using a longer password. |
| `Genmed2026` | Moderate | 3/6 | A longer password or more variety may improve it. |
| `Gen#Med!Pharmacy2026` | Strong | 6/6 | Good password pattern. Avoid reusing passwords. |

This is frontend feedback only. It does not replace server-side password hashing or a password policy.

## Task 4: Sensitive information handling

Audit of the existing code:
- Passwords and sessions are never written to localStorage, sessionStorage or cookies, and
  nothing is logged.
- The session object holds only id, name and role.
- The demo credentials in `demoUsers.js` are public, fictional classroom accounts by design.
- There are no API keys or private keys in the frontend.
- The Login form already clears the password after submit and uses one generic error message.

Improvements:
- `AuthContext.jsx` removes sensitive-looking keys from localStorage at app start and on logout.
  Matching keys include password, token, secret, session, auth, credential, api key, private and genmed.
  It also clears sessionStorage. Storage errors are caught, so logout never breaks.
- Logout remounts the whole UI below the provider, changing a React `key`. This discards every
  component's temporary state, such as form drafts, notes, search filters, open details and password feedback.
  Route changes already unmount most pages; the remount also covers state kept in components
  that stay mounted, such as the navbar.
- The password input stays `type="password"` and uncontrolled. The Show/Hide button has an
  accessible name and `aria-pressed`. The 128-character limit, the generic error and the
  5-attempt cooldown are unchanged.
- Tests scan `src` to confirm there are no storage writes, cookies, console logging or API keys.

## Testing

- `npm test`: 56 tests passed (45 existing and 11 new). `npm run lint` and `npm run build` passed.
- Browser checks were run in Microsoft Edge on the production build (`vite preview`).
  All 8 passed, with 0 alerts and 0 console errors. Screenshots and `results.json` are in
  `docs/activity5-evidence/member1/`.

| ID | Test input or action | Expected result | Actual result | Screenshot |
| --- | --- | --- | --- | --- |
| M1-00 | Open Login and check `typeof window.checkPasswordStrength` | "function" | "function" | (none) |
| M1-01 | Type `ali123` | Weak, with score and message | Weak · 1/6 · "Try using a longer password." | M1-01_login_strength_weak.png |
| M1-02 | Type `Genmed2026` | Moderate | Moderate · 3/6 · "A longer password or more variety may improve it." | M1-02_login_strength_moderate.png |
| M1-03 | Type `Gen#Med!Pharmacy2026` | Strong | Strong · 6/6 · "Good password pattern. Avoid reusing passwords." | M1-03_login_strength_strong.png |
| M1-04 | Check the field type, click Show, then Hide | `password` by default; accessible toggle | password → text → password; aria-pressed false → true | (none) |
| M1-05 | Wrong password `WrongPass#2026` | Generic error; field and feedback cleared; password not in storage, cookies or URL | "Invalid email or password."; field empty; feedback hidden; storage `{}{}` | M1-05_login_failed_cleared.png |
| M1-06 | Log in correctly, then inspect storage | localStorage, sessionStorage and cookies empty | All empty | (none) |
| M1-07 | Leave a request draft and a track search, plant `genmed_session`, `userPassword` and `authToken`, log out, press Back, log in | Sensitive keys removed (`theme` kept); Back does not reopen /track; draft empty | localStorage = [theme], sessionStorage empty; Back went to /login; draft empty | M1-07a_request_draft_before_logout.png, M1-07b_request_after_relogin.png |

Frontend checks are only an extra layer. The backend must hash passwords, enforce the password
policy and rate limits, and manage sessions securely.
