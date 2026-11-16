import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../data/roles';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/Icon';

export default function Login() {
  const { user, login, isLocked, remaining } = useAuth();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  async function submit(event) {
    event.preventDefault();
    if (isLocked() || submitting) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    // SECURITY: Normalize emails, preserve exact passwords, and clear submitted credentials immediately.
    const email = String(fields.get('email') || '').trim();
    const password = String(fields.get('password') || '');
    const next = {};
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (!password || password.length > 128) next.password = 'Enter your password (maximum 128 characters).';
    form.elements.namedItem('password').value = '';
    if (Object.keys(next).length) {
      setErrors({ ...next, form: 'Invalid email or password.' });
      form.elements.namedItem(Object.keys(next)[0])?.focus();
      return;
    }
    // Activity 6: credentials are verified by the backend (bcrypt), which returns a signed JWT.
    setErrors({});
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) setErrors({ form: result.message });
    else form.reset();
  }

  return <section className="container auth-layout">
    <aside className="auth-story">
      <span className="eyebrow">GENMED · YOUR ACCOUNT</span>
      <h1>The right tools.<br /><em>For the right role.</em></h1>
      <p>Patients compare medicine options, submit requests and track their status. Doctors review requests in a separate workspace.</p>
      <div className="auth-illustration"><Icon name="shield" size={56} /><div>
        <strong>Role-aware by design.</strong>
        <p>Your account determines your role. Passwords are verified by the GenMed server, never in the browser.</p>
      </div></div>
    </aside>
    <div className="auth-card">
      <span className="eyebrow">WELCOME BACK</span>
      <h2>Login to GenMed</h2>
      <p>New to GenMed? <Link to="/register">Create an account</Link></p>
      <form noValidate onSubmit={submit}>
        <fieldset disabled={remaining > 0 || submitting}>
          <legend className="sr-only">Login details</legend>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
            <span id="email-error" className="field-error">{errors.email}</span>
          </div>
          <PasswordInput id="password" label="Password" error={errors.password} hint="Enter the password for your account." />
          <button type="submit" className="button full-width">{submitting ? 'Signing in…' : 'Login'} <Icon name="arrow" size={18} /></button>
        </fieldset>
        <div className="form-status" role="status" aria-live="polite">
          {remaining > 0 ? <p className="field-error">Too many attempts. Try again in {remaining} seconds.</p> : errors.form && <p className="field-error">{errors.form}</p>}
        </div>
      </form>
      <Link className="button secondary full-width" to="/register">Create a new account</Link>
      <p className="privacy-note"><Icon name="shield" size={16} /> We collect only what is needed to run your account.</p>
      <p className="fine-print">Your session is kept in memory only and ends when you log out or close the page.</p>
    </div>
  </section>;
}
