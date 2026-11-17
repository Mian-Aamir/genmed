export const REVIEW_DECISIONS = Object.freeze(['reviewed', 'discussion']);

export function validateReview(fields) {
  const input = fields && typeof fields === 'object' ? fields : {};
  const decision = typeof input.decision === 'string' ? input.decision.trim() : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  const errors = {};

  // SECURITY: Allow only the review actions understood by the service and validate normalized note text.
  if (!REVIEW_DECISIONS.includes(decision)) errors.decision = 'Choose a valid review decision.';
  if (!note) errors.note = 'Enter an internal note.';
  else if (note.length > 300) errors.note = 'Internal note must be at most 300 characters.';

  return { ok: Object.keys(errors).length === 0, errors, values: { decision, note } };
}
