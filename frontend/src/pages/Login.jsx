import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demoUsers, dashboardPath } from '../data/demoUsers';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/Icon';

export default function Login() {
  const { user, login, recordFailure, isLocked, remaining } = useAuth();
  const [errors, setErrors] = useState({});
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

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
          <PasswordInput id="password" label="Password" error={errors.password} hint="Enter the exact password for your chosen demo account." />
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
