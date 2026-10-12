# Activity 3 - Module 2: View and Track Medicine Requests

Project: GenMed (Pakistan)
Group: Muhammad Aamir (23F-3073), Ammar Ahmad (23P-3071)
Module 2 owner in the submitted document: Ammar Ahmad (23P-3071).
Working branch found in this checkout: module2-project-activity-3.

## Scope and integration

Only these five files belong to this change:
- src/pages/TrackRequests.jsx
- src/styles/track.css
- src/services/trackHelpers.js
- tests/request-track.test.mjs
- docs/ACTIVITY3_MODULE2_NOTES.md

The existing Patient-only /track route, Navbar, dashboard, AuthContext, shared
requestStore.js, Module 1 and all previous tests remain unchanged. The submitted
document describes HTML/JS filenames; this implementation uses the existing
React pages and in-memory service to deliver the same behavior.

The table reads listOwnRequests(user) on render and each page entry. A request
submitted through Module 1 appears immediately after navigating to /track in the
same tab. No localStorage, backend, persistence, status mutation or new package
is introduced. Refresh resets the demo session and requests as before.

The Patient dashboard's existing card still says "Module 2 coming soon" because
that file is outside Module 2 ownership. Its link opens the implemented page.
The foundation owner may update that description after integration.

## Input and interactions

Search is optional, limited to 20 characters, trimmed and uppercased for matching.
Empty or spaces-only search shows all owned requests subject to the status filter.
Valid partial patterns are G, GM, GM- and GM- followed by up to four digits.
This allows live typing without premature warnings. Other input displays
"Use the format GM-1234" and returns no matches. Matching uses reference prefixes.

Only All and the existing STATUSES values are accepted. Unknown status values
are rejected in the UI handler; direct helper calls with unknown values return
no matches. Search and status are combined. Clear filters resets query, status,
validation feedback and the details panel, then focuses the search box.

View Details resolves the selected reference using getOwnRequest(user, id),
then shows all patient-facing fields, including notes. Internal ownerId is not
displayed. Opening focuses the details heading; closing returns focus to the
trigger. Changing filters closes details. Status badges use both text and color.
The semantic table has a keyboard-focusable horizontal scroll region on mobile.

## Part 6 - Module 2 row

Module: View and Track Medicine Requests.

Possible misuse or problem: A patient guesses another patient's reference number
or enters unexpected search text, excessively long input or a forged status.

Response implemented: Read only through listOwnRequests(session), and resolve
details through getOwnRequest(session, id). The shared actions check Patient role
and ownership. Missing and unowned references return the same "Request not found"
response. Limit and validate search input, allowlist statuses, and display request
text using React escaping. No HTML interpretation, eval or user-data logging.

Backend response required later: Authenticate the session on the server and
enforce ownership on every list/detail endpoint. Validate input, apply rate limits
and appropriate logging, and keep private medical records out of frontend bundles.

Frontend validation alone is not real security. Browser code and client session
objects can be modified. Hiding UI elements is not a security control. Real
authentication, authorization and input validation will be enforced by the backend.
The ownership tests verify demo service behavior, not production confidentiality.

## Testing

The added Node tests cover normalization, valid partial references, invalid input,
known and forged statuses, combined filters, Module 1 integration, owner-only
lists, guessed references, role denial and non-mutating filtering. Existing test
files are unchanged.

Executed on 2026-10-12: npm test passed all 45 tests (35 existing plus 10 new),
npm run lint passed, npm run build passed, and git diff --check passed.
Browser interaction and visual checks were not executed in this turn; the manual
checklist below remains to be performed. No new package was installed.

Run from D:\genmed\frontend:

```powershell
npm test
npm run lint
npm run build
npm run dev
```

Manual checklist:
- Patient login -> Track Requests: three sample rows with correct columns/badges.
- Search gm-1002 and " GM-1002 ": only GM-1002 remains; details open correctly.
- GM-10: partial matches. abc: format hint and no matching requests.
- Empty search: all owned rows, still respecting the selected status.
- Check each status; combine GM-1002 with Delivered to get no matches.
- Clear filters: all rows return and details/feedback clear.
- Submit in Module 1, navigate here: the new Pending reference is first.
- Open and close details with keyboard; inspect long notes and literal script text.
- Check mobile scrolling, focus outlines, labels and navigation links.
- Logout blocks access; Doctor is denied /track; refresh resets the demo.
- Recheck existing home/login, medicine search, review requests and dashboards.

No claim is made that this change has been merged, pushed or deployed.
