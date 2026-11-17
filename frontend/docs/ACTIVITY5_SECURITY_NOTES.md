# Activity 5 Security Implementation Notes

Project: GenMed Pakistan

## Weaknesses and improvements

### Secure input validation

The medicine request form validates normalized input before a request is created:

- Medicine name is required and limited to 3 to 120 characters.
- Category must be one of the predefined categories.
- Quantity must be a whole number from 1 to 20.
- Notes are optional, limited to 200 characters and cannot contain spaces only.

The Doctor review form now also validates an allowlisted review decision and a
trimmed internal note from 1 to 300 characters. The underlying demo service
repeats validation and role authorization when the action is performed.

### XSS prevention

Patient-entered medicine names and notes are displayed through normal React JSX
text rendering. React escapes the text, so values such as
`<script>alert("xss")</script>` are displayed as text rather than executed.
The project does not use `dangerouslySetInnerHTML`, `innerHTML` or `eval` for
these inputs.

### Secure file selection

The optional supporting-document selector on the medicine request form accepts
only PDF, JPG, JPEG and PNG filenames up to 2 MB. Invalid extensions and files
larger than 2 MB show clear feedback. The interface keeps only the selected
filename for temporary feedback; it does not preview, upload, store or send the
file. Client-side checking is only preliminary screening. A future backend must
verify the file content, size, permissions and storage safety.

### Sensitive information handling

Passwords are not written to localStorage or sessionStorage. The application
keeps the mock login session in memory and clears it during logout. The password
input is cleared after form submission. No API keys, private keys or real user
credentials are present in the frontend.

### Password strength checker

The instructor-provided `password_strength_helper.js` is loaded without changing
its implementation. The Login screen calls `window.checkPasswordStrength()` on
each live password change and shows the returned level, score and message. The
password itself is not retained for the strength display.

## Automated results run on 2026-11-11

- `npm test`: 50 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.

The tests cover Weak, Moderate and Strong helper results; accepted and rejected
file selections; review validation; script-like medicine and note text; absence
of unsafe HTML rendering; and absence of localStorage/sessionStorage use in the
relevant frontend sources.

## Screenshot evidence to capture locally

1. Login page with `short` showing Weak feedback.
2. Login page with `Abcdef12` showing Moderate feedback.
3. Login page with `Aa1!abcdefghijklm` showing Strong feedback.
4. Submit Medicine Request with an empty medicine name or quantity `21` showing
   validation feedback.
5. Supporting document selector rejecting a `.exe` file or a file over 2 MB.
6. A submitted request whose notes contain script-like text, displayed literally
   in My Requests without an alert or script execution.
7. Doctor Dashboard showing an empty internal-note validation message.

## Frontend limitation

These protections are part of a classroom frontend prototype. A production
FastAPI backend must repeat validation, authenticate users, authorize each role,
enforce record ownership, rate limit requests, securely process uploads and
store passwords only as strong server-side hashes.
