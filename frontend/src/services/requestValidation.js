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
