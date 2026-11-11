# Activity 5: Member 2, Ammar Ahmad (23P-3071)

Project: GenMed (Pakistan) · Branch: activity5-member2-validation-files
Scope: Task 1 (Secure Input Validation), Task 2 (XSS Prevention) and Task 3 (Secure File Selection).

Files changed: src/pages/RequestMedicine.jsx, src/pages/DoctorDashboard.jsx,
src/components/SecureFileSelection.jsx (new), src/services/requestValidation.js,
src/services/fileValidation.js (new), src/styles/request.css, tests/request-submit.test.mjs,
tests/secure-file-selection.test.mjs (new), tests/xss-rendering.test.mjs (new).

## Task 1: Secure input validation (two forms)

**Form 1: Submit Medicine Request.**
- Medicine: required after trimming, 3 to 120 characters, and must match the medicine-name format.
  The format allows letters, digits, spaces and `. , ' ( ) / % + -`; markup characters such as `<`, `>`, `"` and `{` are rejected.
- Category: must come from the allowlist.
- Quantity: a whole number from 1 to 20. `1.5`, `1e1`, `50` and text are rejected.
- Notes: optional, at most 200 characters, and may not be spaces only.
- Messages appear under each field, the first invalid field receives focus, and nothing is saved until the input is valid.
- `addOwnRequest` repeats the same validation.
- Medicine, quantity and notes have autocomplete turned off, so the browser does not keep them in its form history.

**Form 2: Doctor Review.**
- Decision: required and must be on the allowlist (`reviewed`, `discussion`).
- Internal note: required after trimming, 1 to 300 characters.
- Before this change the form relied on browser popups; it now uses `noValidate` and shows
  accessible messages under each field (`aria-invalid` and `aria-describedby`).
- `demoService.decideReview` still enforces the same limits for direct calls.

Weaknesses found: the medicine name accepted any characters, including script tags. The doctor
form gave no message per field and accepted the browser's default handling.

## Task 2: XSS prevention

How user text is displayed:
- My Requests list (`RequestMedicine.jsx`): `{request.medicine}` and `{request.notes}`.
- Track Requests details (`TrackRequests.jsx`, my Activity 3 module): `<dd>{value}</dd>`.
- Doctor internal note (`DoctorDashboard.jsx`): `{request.internalNote}`.
- The new file selection: `{selected.name}`.

All of these render user text as React text nodes, which React escapes like `textContent`. A scan
of `src` found no `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `document.write`,
`eval` or `new Function`. Safer rendering is kept on purpose and marked with `// SECURITY:` comments.

The medicine-name format rule now also stops markup in that field. `tests/xss-rendering.test.mjs`
checks four things:
- the payloads are stored literally;
- React output escapes them, so `<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>` contains no tag;
- doctor notes are saved literally;
- no source file uses an unsafe sink. The scan ignores comments and is tested against a real `innerHTML` assignment.

## Task 3: Secure file selection

An optional "Supporting document" field on the Submit Medicine Request form
(`SecureFileSelection.jsx`, rules in `fileValidation.js`):
- Allowed extensions are `.pdf`, `.jpg`, `.jpeg` and `.png`. The last extension decides, so `prescription.pdf.exe` is rejected.
- Maximum size is 2 MB, and exactly 2 MB is allowed. Empty files are rejected, as are names over 100 characters or containing path or control characters.
- The MIME type reported by the browser must match the extension.
- The first bytes of the file must match a real PDF, PNG or JPEG, so an EXE renamed to `.pdf` is rejected.
- When a file is rejected, the input is cleared and a clear message is shown. When a file is
  accepted, only its name and size are shown, with the text "File selected for demo only; no upload occurs."
- There is no preview and no upload. The input has no `name`, so the file is never part of the request.
  Nothing is saved to localStorage or sessionStorage. The selection is cleared after a successful request.
- The `accept` attribute only filters the file picker; JavaScript enforces the rules.
- Client-side checks are only a first screen. They cannot prove a file is safe; the backend must re-check and scan every file.

## Testing

- `npm test`: 58 tests passed (45 existing and 13 new). `npm run lint` and `npm run build` passed.
- Browser checks were run in Microsoft Edge on the production build (`vite preview`).
  All 13 passed, with 0 alerts and 0 console errors. Screenshots and `results.json` are in
  `docs/activity5-evidence/member2/`.

| ID | Test input or action | Expected result | Actual result | Screenshot |
| --- | --- | --- | --- | --- |
| M2-01 | Submit the request form with every field empty | Blocked; message under each mandatory field | "Medicine name is required", "Select a valid category", "Quantity must be a whole number between 1 and 20"; still 3 requests | M2-01_request_empty_fields.png |
| M2-02 | Medicine `<script>alert('xss')</script>`, quantity 50, notes of spaces only | Format, range and spaces-only errors; nothing saved | Format hint, quantity range error, spaces-only notes error | M2-02_request_invalid_input.png |
| M2-03 | Medicine `   Paracetamol 500mg   `, quantity ` 2 `, notes `<script>alert('xss')</script>` | Saved trimmed; notes shown as text; no script runs | GM-1004 saved as "Paracetamol 500mg"; notes shown literally; 0 `<script>`; 0 alerts | M2-03_request_xss_literal.png |
| M2-04 | Open GM-1004 in Track Requests | Notes shown as text | Shown literally; 0 `<script>`; 0 alerts | M2-04_track_details_xss_literal.png |
| M2-05 | Select `setup.exe` | Rejected; input cleared | "Unsupported file type (.exe). Allowed types: PDF, JPG, JPEG or PNG." | M2-05_file_setup_exe.png |
| M2-06 | Select `prescription.pdf.exe` | Rejected as .exe | Same message; 0 files selected | M2-06_file_prescription_pdf_exe.png |
| M2-07 | Select `large_prescription.pdf` (3.0 MB) | Rejected for size | "File is too large (3.0 MB). Maximum size is 2.0 MB." | M2-07_file_large_prescription_pdf.png |
| M2-08 | Select an EXE renamed to `renamed_program.pdf` | Rejected on content | "File content is not a real PDF file. It may have been renamed." | M2-08_file_renamed_program_pdf.png |
| M2-09 | Select `prescription_scan.png` | Accepted; name shown | Accepted; "File selected for demo only; no upload occurs."; storage empty | M2-09_file_prescription_scan_png.png |
| M2-10 | Select `prescription.pdf` | Accepted; name shown | Accepted; name and size (193 B) shown; storage empty | M2-10_file_prescription_pdf.png |
| M2-11 | Submit a valid request while a file is selected | Request saved; selection cleared | GM-1005 saved; 0 files selected | (none) |
| M2-12 | Submit the doctor review empty, then with a note of spaces only | Decision and note required | "Choose a review decision." / "Internal note is required." (both times) | M2-12_doctor_review_validation.png |
| M2-13 | Doctor note `<img src=x onerror=alert(1)> Confirm strength.` | Shown as text; no image; no alert | Shown literally; 0 `<img>`; 0 alerts | M2-13_doctor_note_xss_literal.png |

Problem found during testing: the source scan in the XSS test first flagged the `// SECURITY:`
comment that names `dangerouslySetInnerHTML`. The scan now ignores comments, and a test confirms
it still catches a real `innerHTML` assignment.

Frontend validation is only an extra layer. The backend must re-validate all input, encode its
output, and check and scan uploaded files.
