// Activity 5 Task 1: expected format for a medicine name. Letters, digits, spaces and the
// punctuation used in strengths (e.g. "Cetirizine 5 mg / 5 mL", "Co-Amoxiclav (625)").
// SECURITY: Angle brackets, quotes used in markup, braces and control characters are rejected.
export const MEDICINE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .,'()/%+-]*$/;

export function validateRequest(fields, categories) {
  const input = fields && typeof fields === 'object' ? fields : {};
  const medicine = typeof input.medicine === 'string' ? input.medicine.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const rawNotes = input.notes === undefined ? '' : input.notes;
  const notes = typeof rawNotes === 'string' ? rawNotes.trim() : '';
  const rawQuantity = typeof input.quantity === 'number' || typeof input.quantity === 'string'
    ? String(input.quantity).trim()
    : '';
  const quantity = Number(rawQuantity);
  const errors = {};

  // SECURITY: Validate normalized values and allow only predefined categories.
  if (!medicine) {
    errors.medicine = 'Medicine name is required';
  } else if (medicine.length < 3 || medicine.length > 120) {
    errors.medicine = 'Medicine name must be between 3 and 120 characters';
  } else if (!MEDICINE_NAME_PATTERN.test(medicine)) {
    errors.medicine = "Use letters, numbers, spaces and . , ' ( ) / % + - only";
  }
  if (!Array.isArray(categories) || !categories.includes(category)) {
    errors.category = 'Select a valid category';
  }
  // SECURITY: Reject coercion tricks, decimals, exponent notation and out-of-range quantities.
  if (!/^\d+$/.test(rawQuantity) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    errors.quantity = 'Quantity must be a whole number between 1 and 20';
  }
  if (typeof rawNotes !== 'string' || rawNotes.length > 200) {
    errors.notes = 'Notes must be at most 200 characters';
  } else if (rawNotes.length > 0 && !notes) {
    errors.notes = 'Leave notes empty or enter text, not only spaces';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { medicine, category, quantity, notes },
  };
}

// Activity 5 Task 1 (form 2): Doctor Review. The same limits are enforced again by
// decideReview in demoService.js, so skipping the form does not bypass them.
export const REVIEW_DECISIONS = Object.freeze(['reviewed', 'discussion']);
export const REVIEW_NOTE_MAX = 300;

export function validateReview(decision, note) {
  const errors = {};
  const raw = typeof note === 'string' ? note : '';
  const trimmed = raw.trim();
  // SECURITY: Allowlist decisions, even if the dropdown is edited in DevTools.
  if (!REVIEW_DECISIONS.includes(decision)) errors.decision = 'Choose a review decision.';
  if (typeof note !== 'string' || !trimmed) {
    errors.note = 'Internal note is required.';
  } else if (raw.length > REVIEW_NOTE_MAX) {
    errors.note = `Internal note must be ${REVIEW_NOTE_MAX} characters or fewer.`;
  }
  return { ok: Object.keys(errors).length === 0, errors, values: { decision, note: trimmed } };
}
