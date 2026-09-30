# GenMed security notes

Hiding UI elements is not a security control. Real enforcement (authentication, role-based access control, input validation, encryption, logging) will be implemented in the FastAPI backend.

- Demo only, real authentication (JWT + hashing) will be built in the backend. Any syntactically valid form is accepted; login emails ending in `.invalid` simulate rejection. No credentials are compared or stored. Use made-up details and never reuse a real password.
- Passwords exist transiently in the form and submit handler. They are cleared after submission and never written to storage, context, logs, or the network. Password whitespace is preserved instead of silently changing a credential. Ordinary text is trimmed and length-limited.
- Only a display name is retained in React memory. Refresh ends the session. Registration does not create a durable account.
- The protected route is a UI demonstration, not authorization. Frontend bundles and medicine fixtures remain publicly downloadable.
- Five rejected submissions (including invalid forms) trigger a 30-second in-memory cooldown. Navigation and form toggles preserve it; refresh can bypass it. Real rate limiting belongs on the server.
- User text uses React escaping. There is no HTML injection, eval, external CDN, secret, API key, or browser credential storage.
- Future FastAPI endpoints must authenticate and authorize every request, validate input, use secure password hashing, protect sessions/tokens, enforce HTTPS, encrypt sensitive stored data, and audit events without logging credentials or unnecessary personal data.
- Medicine records and prices are unverified fixtures. Matching ingredient, strength, form, and pack size supports price comparison only, not clinical interchangeability. DRAP integration and professional verification are future work.
