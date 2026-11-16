// Server-side input validation (Activity 6 Task 5). The frontend validates the same rules
// (Activity 5), but the server never trusts the browser: every route validates again here.

export const CATEGORIES = Object.freeze(['Painkiller', 'Antibiotic', 'Allergy', 'Stomach/Acid', 'Other']);
export const REQUEST_STATUSES = Object.freeze(['Pending', 'Approved', 'Dispatched', 'Delivered']);
export const REVIEW_DECISIONS = Object.freeze(['reviewed', 'discussion']);
export const REVIEW_NOTE_MAX = 300;
export const MEDICINE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .,'()/%+-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFERENCE_PATTERN = /^GM-(\d{4,9})$/;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const result = (errors, values) => ({ ok: Object.keys(errors).length === 0, errors, values });

export function validateLogin(body) {
  const input = isObject(body) ? body : {};
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  // SECURITY: Passwords are compared exactly (never trimmed) and length-bounded so bcrypt
  // is not fed oversized input.
  const password = typeof input.password === 'string' ? input.password : '';
  const errors = {};
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (!password || password.length > 128) errors.password = 'Enter your password (maximum 128 characters).';
  return result(errors, { email, password });
}

// Registration. Names allow letters from any language plus space . ' -
export const NAME_PATTERN = /^\p{L}[\p{L} .'-]*$/u;
export const PASSWORD_RULES = 'Use 8-128 characters with at least one uppercase letter, one lowercase letter and one number.';

export function checkPasswordPolicy(password, email = '') {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128
    || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return PASSWORD_RULES;
  }
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase()) && email.split('@')[0].length >= 4) {
    return 'Your password must not contain your email name.';
  }
  return '';
}

export function validateRegistration(body) {
  const input = isObject(body) ? body : {};
  // Collapse repeated inner spaces so "Ali   Khan" is stored as "Ali Khan".
  const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const errors = {};
  if (!name) errors.name = 'Full name is required.';
  else if (name.length < 3 || name.length > 80) errors.name = 'Full name must be between 3 and 80 characters.';
  else if (!NAME_PATTERN.test(name)) errors.name = "Use letters, spaces and . ' - only.";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  const passwordError = checkPasswordPolicy(password, email);
  if (passwordError) errors.password = passwordError;
  // SECURITY: There is deliberately no "role" field. Any role sent by the client is ignored.
  return result(errors, { name, email, password });
}

// Module 2: Submit Medicine Request (same rules as frontend/src/services/requestValidation.js).
export function validateMedicineRequest(body) {
  const input = isObject(body) ? body : {};
  const medicine = typeof input.medicine === 'string' ? input.medicine.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const rawNotes = input.notes === undefined || input.notes === null ? '' : input.notes;
  const notes = typeof rawNotes === 'string' ? rawNotes.trim() : '';
  const rawQuantity = typeof input.quantity === 'number' || typeof input.quantity === 'string'
    ? String(input.quantity).trim()
    : '';
  const quantity = Number(rawQuantity);
  const errors = {};

  if (!medicine) errors.medicine = 'Medicine name is required';
  else if (medicine.length < 3 || medicine.length > 120) errors.medicine = 'Medicine name must be between 3 and 120 characters';
  else if (!MEDICINE_NAME_PATTERN.test(medicine)) errors.medicine = "Use letters, numbers, spaces and . , ' ( ) / % + - only";
  if (!CATEGORIES.includes(category)) errors.category = 'Select a valid category';
  if (!/^\d+$/.test(rawQuantity) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    errors.quantity = 'Quantity must be a whole number between 1 and 20';
  }
  if (typeof rawNotes !== 'string' || rawNotes.length > 200) errors.notes = 'Notes must be at most 200 characters';
  else if (rawNotes.length > 0 && !notes) errors.notes = 'Leave notes empty or enter text, not only spaces';

  return result(errors, { medicine, category, quantity, notes });
}

export function validateRequestStatus(body) {
  const status = isObject(body) && typeof body.status === 'string' ? body.status.trim() : '';
  const errors = {};
  if (!REQUEST_STATUSES.includes(status)) errors.status = 'Choose a valid status.';
  return result(errors, { status });
}

// Module 1: Doctor review decision (same rules as validateReview in the frontend).
export function validateReviewDecision(body) {
  const input = isObject(body) ? body : {};
  const decision = typeof input.decision === 'string' ? input.decision : '';
  const raw = typeof input.note === 'string' ? input.note : '';
  const note = raw.trim();
  const errors = {};
  if (!REVIEW_DECISIONS.includes(decision)) errors.decision = 'Choose a review decision.';
  if (typeof input.note !== 'string' || !note) errors.note = 'Internal note is required.';
  else if (raw.length > REVIEW_NOTE_MAX) errors.note = `Internal note must be ${REVIEW_NOTE_MAX} characters or fewer.`;
  return result(errors, { decision, note });
}

export function validateMedicineId(body) {
  const value = isObject(body) ? body.medicineId : undefined;
  const errors = {};
  if (!Number.isInteger(value) || value < 1 || value > 1_000_000) errors.medicineId = 'Choose a medicine from the sample list.';
  return result(errors, { medicineId: value });
}

/** Parses an integer route id such as "12"; returns null for anything else. */
export function parseId(value) {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

/** Parses a public request reference such as "GM-1004" into its numeric id. */
export function parseReference(value) {
  const match = typeof value === 'string' ? REFERENCE_PATTERN.exec(value.trim().toUpperCase()) : null;
  return match ? Number(match[1]) : null;
}

export const formatReference = id => `GM-${id}`;
