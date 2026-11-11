import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demoUsers, dashboardPath } from '../data/demoUsers';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import Icon from '../components/Icon';

// Activity 5 Task 5: call the instructor-provided browser global loaded by index.html.
function evaluatePasswordStrength(password) {
  // SECURITY: The helper is a plain <script> global, not an imported module. Fail safely if it is missing.
  if (typeof window.checkPasswordStrength !== 'function') return null;
  return window.checkPasswordStrength(password);
}

export default function Login() {
  const { user, login, recordFailure, isLocked, remaining } = useAuth();
  const [errors, setErrors] = useState({});
  // SECURITY: Only the helper's result (level/score/message) is kept in state, never the password.
  const [strength, setStrength] = useState(null);
  const helperLoaded = typeof window.checkPasswordStrength === 'function';
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  function onPasswordChange(event) {
    // Activity 5 Task 5: evaluate on every entry or modification of the password.
    const value = event.target.value;
    setStrength(value ? evaluatePasswordStrength(value) : null);
  }

  function submit(event) {
    event.preventDefault();
    if (isLocked()) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    // SECURITY: Normalize emails, preserve exact passwords, and clear submitted credentials immediately.
    const email = String(fields.get('email') || '').trim();
    const password = String(fields.get('password') || '');
    const next = {};
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (!password || password.length > 128) next.password = 'Enter the demo password (maximum 128 characters).';
    form.elements.namedItem('password').value = '';
    // SECURITY: The password field is cleared on every submit, so its strength feedback is cleared too.
    setStrength(null);
    if (Object.keys(next).length) {
      recordFailure();
      setErrors({ ...next, form: 'Invalid email or password.' });
      form.elements.namedItem(Object.keys(next)[0])?.focus();
      return;
    }
    const result = login(email, password);
    if (!result.ok) setErrors({ form: result.message });
    else form.reset();
  }

  return <section className="container auth-layout">
    <aside className="auth-story">
      <span className="eyebrow">GENMED · DEVELOPMENT ACTIVITY 2</span>
      <h1>The right tools.<br /><em>For the right role.</em></h1>
      <p>Patients explore medicine options and track review requests. Doctors review the fictional requests in a separate workspace.</p>
      <div className="auth-illustration"><Icon name="shield" size={56} /><div>
        <strong>Role-aware by design.</strong>
        <p>Your demo account determines your role. Registration and real account verification will be added with the backend.</p>
      </div></div>
      <p className="fine-print">Frontend demonstration only. These accounts are not real patients or licensed professionals.</p>
    </aside>
    <div className="auth-card">
      <span className="eyebrow">WELCOME BACK</span>
      <h2>Login to GenMed</h2>
      <p>Use one of the public classroom accounts below.</p>
      <details className="demo-accounts" open>
        <summary>Demo accounts — fictional and public</summary>
        {demoUsers.map(account => <div key={account.id}>
          <strong>{account.role === 'patient' ? 'Patient' : 'Doctor'} · {account.name}</strong>
          <span>Email: <code>{account.email}</code></span>
          <span>Password: <code>{account.password}</code></span>
        </div>)}
      </details>
      <p className="demo-note">Only these demo credentials are accepted. Do not enter a real password. Sessions and review changes reset on page refresh.</p>
      <form noValidate onSubmit={submit}>
        <fieldset disabled={remaining > 0}>
          <legend className="sr-only">Demo login details</legend>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
            <span id="email-error" className="field-error">{errors.email}</span>
          </div>
          <PasswordInput id="password" label="Password" error={errors.password} hint="Enter the exact password for your chosen demo account."
            onChange={onPasswordChange} describedBy="password-strength" />
          <PasswordStrengthMeter id="password-strength" result={strength} unavailable={!helperLoaded} />
          <button type="submit" className="button full-width">Login <Icon name="arrow" size={18} /></button>
        </fieldset>
        <div className="form-status" role="status" aria-live="polite">
          {remaining > 0 ? <p className="field-error">Too many attempts. Try again in {remaining} seconds.</p> : errors.form && <p className="field-error">{errors.form}</p>}
        </div>
      </form>
      <p className="privacy-note"><Icon name="shield" size={16} /> We collect only what is needed to run your account.</p>
      <p className="fine-print">No browser storage. No real account creation in this activity.</p>
    </div>
  </section>;
}
