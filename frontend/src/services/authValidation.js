// Registration form validation. The same rules are enforced again on the server
// (backend/src/validation.js); a test checks both give identical results.
export const NAME_PATTERN = /^\p{L}[\p{L} .'-]*$/u;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

export function validateRegistration({ name, email, password, confirmPassword }) {
  const cleanName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const errors = {};
  if (!cleanName) errors.name = 'Full name is required.';
  else if (cleanName.length < 3 || cleanName.length > 80) errors.name = 'Full name must be between 3 and 80 characters.';
  else if (!NAME_PATTERN.test(cleanName)) errors.name = "Use letters, spaces and . ' - only.";
  if (!cleanEmail || cleanEmail.length > 254 || !EMAIL_PATTERN.test(cleanEmail)) errors.email = 'Enter a valid email address.';
  const passwordError = checkPasswordPolicy(password, cleanEmail);
  if (passwordError) errors.password = passwordError;
  if (confirmPassword !== undefined && confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';
  return { ok: Object.keys(errors).length === 0, errors, values: { name: cleanName, email: cleanEmail, password } };
}
