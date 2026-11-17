import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../data/roles';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import Icon from '../components/Icon';
import { PASSWORD_RULES, validateRegistration } from '../services/authValidation';

// Activity 5 Task 5: call the instructor-provided browser global loaded by index.html.
function evaluatePasswordStrength(password) {
  // SECURITY: The helper is a plain <script> global, not an imported module. Fail safely if it is missing.
  if (typeof window.checkPasswordStrength !== 'function') return null;
  return window.checkPasswordStrength(password);
}

export default function Register() {
  const { user, register } = useAuth();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // SECURITY: Only the helper's result (level/score/message) is kept in state, never the password.
  const [strength, setStrength] = useState(null);
  const helperLoaded = typeof window.checkPasswordStrength === 'function';
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  function onPasswordChange(event) {
    // Activity 5 Task 5: evaluate on every entry or modification of the password.
    const value = event.target.value;
    setStrength(value ? evaluatePasswordStrength(value) : null);
    setErrors(previous => ({ ...previous, password: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const validation = validateRegistration({
      name: String(fields.get('name') || ''),
      email: String(fields.get('email') || ''),
      password: String(fields.get('password') || ''),
      confirmPassword: String(fields.get('confirmPassword') || ''),
    });
    const focusFirst = fieldErrors => form.elements.namedItem(Object.keys(fieldErrors)[0])?.focus();
    if (!validation.ok) {
      setErrors({ ...validation.errors, form: 'Please check the highlighted fields.' });
      focusFirst(validation.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    // POST /api/auth/register. The server validates again, hashes the password with bcrypt,
    // always creates a patient account and returns a signed JWT.
    const result = await register(validation.values.name, validation.values.email, validation.values.password);
    setSubmitting(false);
    if (!result.ok) {
      setErrors({ ...(result.errors || {}), form: result.message });
      if (result.errors) focusFirst(result.errors);
      return;
    }
    // SECURITY: Clear the password fields once they are no longer needed.
    form.reset();
    setStrength(null);
  }

  return <section className="container auth-layout">
    <aside className="auth-story">
      <span className="eyebrow">GENMED · CREATE YOUR ACCOUNT</span>
      <h1>Affordable medicine,<br /><em>clearer choices.</em></h1>
      <p>Create a free patient account to compare medicine options, submit medicine requests and track their status.</p>
      <div className="auth-illustration"><Icon name="shield" size={56} /><div>
        <strong>Your password stays protected.</strong>
        <p>It is sent only to the GenMed server, where it is stored as a one-way bcrypt hash, never as plain text.</p>
      </div></div>
      <p className="fine-print">Doctor accounts are created by the GenMed administrator.</p>
    </aside>
    <div className="auth-card">
      <span className="eyebrow">NEW PATIENT</span>
      <h2>Create your account</h2>
      <p>Already registered? <Link to="/login">Log in</Link></p>
      <form noValidate onSubmit={submit}>
        <fieldset disabled={submitting}>
          <legend className="sr-only">Account details</legend>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name" maxLength={80} required aria-invalid={Boolean(errors.name)} aria-describedby="name-error" />
            <span id="name-error" className="field-error">{errors.name}</span>
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
            <span id="email-error" className="field-error">{errors.email}</span>
          </div>
          <PasswordInput id="password" label="Password" newPassword error={errors.password} hint={PASSWORD_RULES}
            onChange={onPasswordChange} describedBy="password-strength" />
          <PasswordStrengthMeter id="password-strength" result={strength} unavailable={!helperLoaded} />
          <PasswordInput id="confirmPassword" label="Confirm password" newPassword error={errors.confirmPassword}
            hint="Type the same password again." onChange={() => setErrors(previous => ({ ...previous, confirmPassword: undefined }))} />
          <button type="submit" className="button full-width">{submitting ? 'Creating account…' : 'Create account'} <Icon name="arrow" size={18} /></button>
        </fieldset>
        <div className="form-status" role="status" aria-live="polite">
          {errors.form && <p className="field-error">{errors.form}</p>}
        </div>
      </form>
      <p className="privacy-note"><Icon name="shield" size={16} /> We collect only your name and email to run your account.</p>
    </div>
  </section>;
}
