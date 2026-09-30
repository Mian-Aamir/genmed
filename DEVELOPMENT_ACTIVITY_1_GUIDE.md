# GenMed Development Activity 1 — Complete code and setup

```text
D:\genmed\frontend\
├── index.html
├── package.json                    (existing, unchanged)
├── package-lock.json               (existing, unchanged)
├── vite.config.js                  (existing, unchanged)
├── eslint.config.js                (existing, unchanged)
├── vercel.json
├── ../SECURITY_NOTES.md             (project root)
├── ../DEVELOPMENT_ACTIVITY_1_GUIDE.md (project root)
├── public/
│   ├── _redirects
│   └── genmed.svg
└── src/
    ├── main.jsx                    (existing, unchanged)
    ├── index.css
    ├── App.jsx
    ├── context/
    │   └── AuthContext.jsx
    ├── components/
    │   ├── Icon.jsx
    │   ├── Navbar.jsx
    │   ├── Footer.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── PasswordInput.jsx
    │   ├── SearchBar.jsx
    │   └── MedicineCard.jsx
    ├── pages/
    │   ├── Home.jsx
    │   ├── Login.jsx
    │   ├── Search.jsx
    │   └── NotFound.jsx
    ├── data/
    │   └── medicines.js
    └── styles/
        └── app.css
```

Existing unused starter assets may still be present; the app does not import them.

Assumption: use the GenMed proposal found in Downloads, rather than the differently named AI Socratic Tutor attachment. The GenMed proposal and Project Activity 1 PDF were read before implementation. The documents describe the broader project and university deliverables; your request defines this patient-only frontend scope.

All code below has already been written into D:\genmed\frontend. No package was added. Your main.jsx already wraps App in BrowserRouter and imports index.css, so it needs no change. Do not add a second BrowserRouter. Each block below contains the entire named file; copy only the code block into that file if recreating the project.

Medicine records are illustrative prototype fixtures, not verified catalog records. Similar names do not establish clinical interchangeability. Groups match active ingredient, strength, form, and pack size for consistent sample price comparisons.

## frontend/src/index.css

```css
@import './styles/app.css';
:root {
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #163d39;
  background: #f7faf9;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --primary: #08796b;
  --primary-dark: #075b51;
  --ink: #163d39;
  --muted: #536b66;
  --surface: #fff;
  --background: #f7faf9;
  --border: #d8e5df;
  --mint: #e9f5ef;
  --saving: #e7f2c9;
  --error: #b42318;
  --shadow: 0 12px 32px #173e3910;
  --space-1: .5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input, select { font: inherit; }
button, a { touch-action: manipulation; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .65; }
a { color: var(--primary-dark); text-underline-offset: 4px; }
button, a { transition: background .18s ease, box-shadow .18s ease; }
:focus-visible { outline: 3px solid #986700; outline-offset: 4px; }
h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { line-height: 1.15; letter-spacing: -.035em; }
p { line-height: 1.7; }
svg { flex-shrink: 0; vertical-align: middle; }
::selection { background: #c9eadc; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
```

## frontend/src/App.jsx

```jsx
import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Search from './pages/Search';
import NotFound from './pages/NotFound';

export default function App() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => {
    const titles = { '/': 'Medicine choices, made clearer', '/login': 'Your account', '/search': 'Find medicine alternatives' };
    document.title = `${titles[pathname] || 'Page not found'} | GenMed`;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);
  return <AuthProvider>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar />
    <main id="main" ref={main} tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </AuthProvider>;
}
```

## frontend/src/context/AuthContext.jsx

```jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // SECURITY: Demo only, real authentication (JWT + hashing) will be built in the backend.
  // SECURITY: Only a display name is kept in memory. No credentials, tokens, or browser storage.
  const [user, setUser] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const attempts = useRef(0);
  const lockedUntil = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((lockedUntil.current - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  function isLocked() { return Date.now() < lockedUntil.current; }
  function recordFailure() {
    if (isLocked()) return;
    // SECURITY: Real rate limiting must be done on the server; this in-memory demo is bypassable.
    // Keeping this in the provider preserves throttling across navigation and form toggles.
    attempts.current += 1;
    if (attempts.current >= 5) {
      lockedUntil.current = Date.now() + 30000;
      attempts.current = 0;
      setRemaining(30);
    }
  }
  function signIn(name) {
    if (isLocked()) return;
    attempts.current = 0;
    setUser({ name: name || 'Patient' });
  }
  function logout() { setUser(null); }
  return <AuthContext.Provider value={{ user, signIn, logout, recordFailure, isLocked, remaining }}>{children}</AuthContext.Provider>;
}
// The context hook intentionally shares this small module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
```

## frontend/src/components/Icon.jsx

```jsx
export default function Icon({ name = 'cross', size = 22 }) {
  const paths = {
    cross: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
    pill: <><path d="m6 12 6-6a4.24 4.24 0 0 1 6 6l-6 6a4.24 4.24 0 0 1-6-6Z" /><path d="m9 9 6 6" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    wallet: <><path d="M4 6h15v14H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13v2M19 10h3v6h-7v-6z" /><path d="M18 13h1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.cross}</svg>;
}
```

## frontend/src/components/Navbar.jsx

```jsx
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [openPath, setOpenPath] = useState(null);
  const open = openPath === pathname;
  const close = () => setOpenPath(null);
  return <header className="site-header" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
    <div className="container nav-wrap">
      <Link className="brand" to="/" onClick={close} aria-label="GenMed home"><span className="brand-mark"><Icon size={23} /></span>Gen<span>Med</span><span className="country">PAKISTAN</span></Link>
      <button className="menu-toggle icon-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpenPath(open ? null : pathname)}><Icon name={open ? 'close' : 'menu'} /></button>
      <nav id="primary-navigation" className={`navigation ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <NavLink to="/" end onClick={close}>Home</NavLink>
        <NavLink to="/search" onClick={close}>Find medicine</NavLink>
        {user ? <><span className="welcome">Welcome, {user.name}</span><button className="button secondary small" onClick={() => { logout(); close(); }}>Logout</button></> : <NavLink className="button secondary small" to="/login" onClick={close}>Login <Icon name="arrow" size={17} /></NavLink>}
      </nav>
    </div>
  </header>;
}
```

## frontend/src/components/Footer.jsx

```jsx
import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function Footer() {
  return <footer className="site-footer"><div className="container footer-row"><div><Link className="brand footer-brand" to="/"><Icon /> GenMed</Link><p>Clearer choices. More affordable care.</p></div><nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/login">Account</Link><Link to="/search">Find medicine</Link></nav><p className="fine-print">© {new Date().getFullYear()} GenMed Pakistan<br />Patient prototype · Development Activity 1</p></div></footer>;
}
```

## frontend/src/components/ProtectedRoute.jsx

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // SECURITY: This is only a UI-level guard. Real access control will be enforced by the backend.
  return user ? children : <Navigate to="/login" replace />;
}
```

## frontend/src/components/PasswordInput.jsx

```jsx
import { useState } from 'react';
import Icon from './Icon';

export default function PasswordInput({ id, label, error, newPassword = false, hint }) {
  const [visible, setVisible] = useState(false);
  return <div className="field"><label htmlFor={id}>{label}</label><div className="password-wrap">
    {/* SECURITY: Passwords stay only in the live form and use the appropriate autocomplete. */}
    <input id={id} name={id} type={visible ? 'text' : 'password'} maxLength={128} autoComplete={newPassword ? 'new-password' : 'current-password'} required aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} />
    <button className="icon-button" type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" size={20} /><span>{visible ? 'Hide' : 'Show'}</span></button>
  </div><span id={`${id}-help`} className={error ? 'field-error' : 'field-hint'}>{error || hint}</span></div>;
}
```

## frontend/src/components/SearchBar.jsx

```jsx
import Icon from './Icon';

export default function SearchBar({ value, onChange, searching }) {
  return <div className="search-box"><label htmlFor="medicine-query">Medicine brand or active ingredient</label><div className="search-input"><Icon name="search" /><input id="medicine-query" type="search" value={value} onChange={event => onChange(event.target.value.slice(0, 50))} maxLength={50} placeholder="Try Panadol or Paracetamol" autoComplete="off" aria-describedby="search-help search-count" />{value && <button type="button" className="icon-button" onClick={() => onChange('')} aria-label="Clear search"><Icon name="close" size={18} /></button>}</div><div className="search-meta"><span id="search-help">{searching ? 'Searching sample medicines…' : 'Search by the name on your medicine pack.'}</span><span id="search-count">{value.length}/50</span></div></div>;
}
```

## frontend/src/components/MedicineCard.jsx

```jsx
import Icon from './Icon';

export default function MedicineCard({ medicine, maximum, minimum, matched }) {
  const saving = Math.round(((maximum - medicine.price) / maximum) * 100);
  const best = medicine.price === minimum;
  return <article className={`medicine-card ${best ? 'best-value' : ''}`}>
    <div className="card-top"><span className="medicine-icon"><Icon name="pill" /></span><span className="badge savings">Save {saving}%</span></div>
    <div className="medicine-title"><h3>{medicine.brand}</h3>{best && <span className="best-label"><Icon name="check" size={15} /> Best Value</span>}</div>
    <p className="formula">{medicine.formula}</p>
    <div className="tags"><span>{medicine.strength}</span><span>{medicine.form}</span>{matched && <span>Search match</span>}</div>
    <dl><div><dt>Manufacturer</dt><dd>{medicine.manufacturer}</dd></div><div><dt>Comparison pack</dt><dd>{medicine.pack}</dd></div></dl>
    <div className="price-row"><div><span className="field-hint">Approximate pack price</span><strong>PKR {medicine.price.toLocaleString('en-PK')}</strong></div><span className="field-hint">Sample price</span></div>
  </article>;
}
```

## frontend/src/pages/Home.jsx

```jsx
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function Home() {
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><span className="eyebrow"><span className="status-dot" /> MADE FOR PATIENTS IN PAKISTAN</span><h1>Your medicine.<br />The same formula.<br /><em>A lighter bill.</em></h1><p>Discover affordable brands with the same active ingredient. Understand your options, compare sample prices, and start a better conversation about your care.</p><div className="actions"><Link className="button" to="/search">Find Cheaper Medicine <Icon name="arrow" size={19} /></Link><Link className="button secondary" to="/login">Login</Link></div><div className="hero-note"><Icon name="shield" size={18} /> Clear information. Thoughtful choices.</div></div>
      <div className="hero-visual"><div className="comparison-preview"><div className="preview-heading"><span className="medicine-icon"><Icon name="pill" size={25} /></span><span>ONE FORMULA, MORE OPTIONS<strong>Paracetamol · 500 mg</strong></span><span className="preview-dot">●</span></div><div className="preview-row"><div><strong>Panadol</strong><small>Tablet · 10 tablets</small></div><strong>PKR 40</strong></div><div className="preview-row selected"><div><span className="best-label"><Icon name="check" size={15} /> BEST VALUE</span><strong>Paracetamol Local</strong><small>Tablet · 10 tablets</small></div><div><strong>PKR 20</strong><span className="badge savings">Save 50%</span></div></div><div className="preview-bottom"><Icon name="shield" size={17} /> Compare, then confirm with a professional.</div></div><div className="floating-note"><span><Icon name="wallet" /></span><div><strong>A small switch. A meaningful saving.</strong><small>Illustrative comparison · not a recommendation</small></div></div><p className="visual-caption">Sample prices only. No clinical verification implied.</p></div>
    </div></section>
    <section className="assurance-strip"><div className="container"><span><Icon name="pill" size={19} /> Compare matching formulations</span><span><Icon name="wallet" size={19} /> Prices in Pakistani rupees</span><span><Icon name="shield" size={19} /> Privacy-conscious by design</span></div></section>
    <section className="container section" aria-labelledby="how-title"><div className="section-heading"><div><span className="eyebrow">HOW IT WORKS</span><h2 id="how-title">Your next step to affordable care.</h2></div><p>Three simple steps.<br />You stay in control.</p></div><div className="three-grid">{[
      ['01', 'Search your medicine', 'Enter a brand name or active ingredient from your medicine pack.', 'search'],
      ['02', 'Explore the alternatives', 'Compare matching strengths, dosage forms, and sample pack prices.', 'pill'],
      ['03', 'Confirm before switching', 'Ask your doctor or pharmacist which option is appropriate for you.', 'shield'],
    ].map(([number, title, description, icon]) => <article className="step-card" key={number}><div><span className="step-number">{number}</span><Icon name={icon} size={25} /></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="container why-section" aria-labelledby="why-title"><div><span className="eyebrow">WHY GENMED</span><h2 id="why-title">Better information.<br />More confident choices.</h2><p>Medicine costs matter. So does understanding what you are comparing.</p><Link className="text-link" to="/search">Explore medicine options <Icon name="arrow" size={18} /></Link></div><div className="why-list"><article><Icon name="wallet" /><div><h3>See potential savings</h3><p>Compare approximate prices with a clear, consistent pack size.</p></div></article><article><Icon name="pill" /><div><h3>Understand the formula</h3><p>See the active ingredient, strength, and form together.</p></div></article><article><Icon name="shield" /><div><h3>Doctor-verified alternatives <span className="badge">Coming soon</span></h3><p>Professional review is planned. Current sample results are not verified.</p></div></article></div></section>
    <div className="container sample-note">Sample data for prototype, real data will come from the DRAP database.</div>
  </>;
}
```

## frontend/src/pages/Login.jsx

```jsx
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Icon from '../components/Icon';

export default function Login() {
  const { user, signIn, recordFailure, isLocked, remaining } = useAuth();
  const [register, setRegister] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const pending = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (user) return <Navigate to="/search" replace />;

  function submit(event) {
    event.preventDefault();
    if (pending.current || isLocked()) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    // SECURITY: Trim ordinary input; preserve password whitespace. Never log or persist credentials.
    const email = String(fields.get('email') || '').trim().slice(0, 254);
    const name = String(fields.get('fullName') || '').trim().slice(0, 80);
    const password = String(fields.get('password') || '');
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) next.password = 'Use 8–128 characters with uppercase, lowercase, and a number.';
    if (register && !name) next.fullName = 'Enter your full name.';
    if (register && password !== fields.get('confirmPassword')) next.confirmPassword = 'Passwords must match.';
    // SECURITY: Reserved .invalid addresses simulate rejection without storing demo credentials.
    const rejected = !register && email.toLowerCase().endsWith('.invalid');
    if (Object.keys(next).length || rejected) {
      recordFailure();
      setErrors({ ...next, form: register ? 'Please check the highlighted fields.' : 'Invalid email or password.' });
      form.elements.namedItem('password').value = '';
      if (register) form.elements.namedItem('confirmPassword').value = '';
      form.elements.namedItem(Object.keys(next)[0] || 'email')?.focus();
      return;
    }
    setErrors({});
    pending.current = true;
    setBusy(true);
    // SECURITY: Clear the form immediately. The delayed callback uses only the display name.
    form.reset();
    timer.current = window.setTimeout(() => { signIn(register ? name : 'Patient'); }, 800);
  }
  function toggle() { setRegister(!register); setErrors({}); }
  return <section className="container auth-layout">
    <aside className="auth-story"><span className="eyebrow">YOUR HEALTH. YOUR CHOICE.</span><h1>A little knowledge.<br /><em>A little more peace of mind.</em></h1><p>Explore medicine options with clear formulas and straightforward sample prices.</p><div className="auth-illustration"><Icon name="shield" size={60} /><div><strong>Only the essentials.</strong><p>No CNIC, address, or medical history needed for this prototype.</p></div></div><p className="fine-print">A patient-focused prototype for more affordable care in Pakistan.</p></aside>
    <div className="auth-card"><span className="eyebrow">LET’S GET STARTED</span><h2>{register ? 'Create your account' : 'Welcome to GenMed'}</h2><p>{register ? 'Take the first step towards clearer medicine choices.' : 'Enter the demo to explore medicine alternatives.'}</p>
      <div className="auth-tabs" role="group" aria-label="Account form"><button type="button" aria-pressed={!register} className={!register ? 'selected' : ''} disabled={busy || remaining > 0} onClick={() => { if (register) toggle(); }}>Login</button><button type="button" aria-pressed={register} className={register ? 'selected' : ''} disabled={busy || remaining > 0} onClick={() => { if (!register) toggle(); }}>Register</button></div>
      <p className="demo-note">Demo only: use a made-up email and a new, unused password. Any valid entry opens the demo; no account is stored. Login emails ending in <strong>.invalid</strong> simulate failure.</p>
      <form key={register ? 'register' : 'login'} noValidate onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy || remaining > 0}><legend className="sr-only">{register ? 'Register' : 'Login'} details</legend>
          {register && <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" maxLength={80} required aria-invalid={Boolean(errors.fullName)} aria-describedby="name-error" /><span id="name-error" className="field-error">{errors.fullName}</span></div>}
          <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={Boolean(errors.email)} aria-describedby="email-error" placeholder="you@example.com" /><span id="email-error" className="field-error">{errors.email}</span></div>
          <PasswordInput id="password" label="Password" newPassword={register} error={errors.password} hint="8–128 characters, including uppercase, lowercase, and a number." />
          {register && <PasswordInput id="confirmPassword" label="Confirm password" newPassword error={errors.confirmPassword} />}
          <button className="button full-width" type="submit">{busy ? 'Opening your demo…' : register ? 'Create demo account' : 'Login to GenMed'}<Icon name="arrow" size={18} /></button>
        </fieldset>
        <div aria-live="polite" aria-atomic="true" className="form-status">{remaining > 0 ? <p className="field-error">Too many attempts. Try again in {remaining} seconds.</p> : errors.form ? <p className="field-error">{errors.form}</p> : busy ? <p>Success! Taking you to medicine search…</p> : null}</div>
      </form>
      <p className="privacy-note"><Icon name="shield" size={16} /> We collect only what is needed to run your account.</p><p className="fine-print">Your demo session ends when you refresh the page.</p>
    </div>
  </section>;
}
```

## frontend/src/pages/Search.jsx

```jsx
import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import MedicineCard from '../components/MedicineCard';
import Icon from '../components/Icon';
import { medicines, comparisonKey } from '../data/medicines';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [form, setForm] = useState('all');
  const [sort, setSort] = useState('asc');
  // SECURITY: Search text is length-limited and rendered only through React escaping.
  const normalized = query.trim().toLowerCase().slice(0, 50);
  const searching = normalized !== debounced;
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(normalized), 350);
    return () => window.clearTimeout(timer);
  }, [normalized]);
  const groups = useMemo(() => {
    if (!debounced) return [];
    const matches = medicines.filter(item => `${item.brand} ${item.formula}`.toLowerCase().includes(debounced));
    const keys = [...new Set(matches.map(comparisonKey))];
    return keys.map(key => {
      const all = medicines.filter(item => comparisonKey(item) === key);
      const prices = all.map(item => item.price);
      return { key, all, matchedIds: matches.map(item => item.id), minimum: Math.min(...prices), maximum: Math.max(...prices) };
    });
  }, [debounced]);
  const visibleGroups = groups.filter(group => form === 'all' || group.all[0].form === form);
  const count = visibleGroups.reduce((total, group) => total + group.all.length, 0);
  function changeQuery(value) { setQuery(value); setForm('all'); }
  return <div className="search-page">
    <section className="search-heading"><div className="container"><span className="eyebrow">MAKE AN INFORMED CHOICE</span><h1>Same formula. Explore your options.</h1><p>Find your medicine, understand its ingredients, and compare sample prices.</p><SearchBar value={query} onChange={changeQuery} searching={searching} /><div className="suggestions"><span>Try a search:</span>{['Panadol', 'Ibuprofen', 'Omeprazole'].map(name => <button key={name} type="button" onClick={() => changeQuery(name)}>{name}</button>)}</div></div></section>
    <section className="container results-section" aria-label="Medicine results">
      <div className="sample-note"><Icon name="shield" size={18} /><span>Sample data for prototype, real data will come from the DRAP database.<br /><small>Brand details and prices are illustrative, unverified, and not live DRAP records.</small></span></div>
      <div className="filter-row"><div><h2>Medicine comparisons</h2><p aria-live="polite" role="status">{searching ? 'Searching…' : debounced ? `${count} sample options in ${visibleGroups.length} matching groups` : 'Start with a brand or active ingredient.'}</p></div><div className="filters"><div className="field"><label htmlFor="dosage-form">Dosage form</label><select id="dosage-form" value={form} onChange={event => setForm(event.target.value)}><option value="all">All forms</option><option>Tablet</option><option>Capsule</option><option>Syrup</option></select></div><div className="field"><label htmlFor="price-sort">Sort by price</label><select id="price-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="asc">Low to high</option><option value="desc">High to low</option></select></div></div></div>
      <div aria-busy={searching}>
        {searching ? <div className="empty-state"><Icon name="search" size={36} /><h3>Searching sample medicines…</h3><p>Finding matching ingredients and comparable packs.</p></div>
          : !debounced ? <div className="empty-state"><span className="empty-icon"><Icon name="search" size={32} /></span><h2>Let’s find out what’s in your medicine.</h2><p>Search a brand like Panadol or an ingredient like Paracetamol.<br />Your comparison will appear here.</p><span className="badge">15 sample medicines · 5 active ingredients</span></div>
          : !count ? <div className="empty-state"><Icon name="search" size={36} /><h2>{groups.length ? 'No options in this dosage form' : 'No medicine found, check spelling'}</h2><p>{groups.length ? 'Try all dosage forms to see the matching sample results.' : 'Try a different brand or search by active ingredient.'}</p><button className="button secondary" onClick={() => groups.length ? setForm('all') : changeQuery('')}>{groups.length ? 'Show all forms' : 'Clear search'}</button></div>
          : visibleGroups.map(group => <section className="formula-group" key={group.key} aria-labelledby={`group-${group.all[0].id}`}>
            <div className="formula-banner"><span className="medicine-icon"><Icon name="pill" /></span><div><span className="eyebrow">MATCHING ACTIVE INGREDIENT</span><h2 id={`group-${group.all[0].id}`}>{group.all[0].formula}</h2><p>{group.all[0].strength} · {group.all[0].form} · {group.all[0].pack}</p></div></div>
            <p className="comparison-caption">Search matches and same-formulation alternatives. Savings compare with the highest sample pack price in this group (PKR {group.maximum}). Best Value means lowest sample price, not clinical suitability.</p>
            <div className="medicine-grid">{[...group.all].sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price).map(medicine => <MedicineCard key={medicine.id} medicine={medicine} maximum={group.maximum} minimum={group.minimum} matched={group.matchedIds.includes(medicine.id)} />)}</div>
          </section>)}
      </div>
      <aside className="safety-note"><Icon name="shield" size={23} /><div><strong>Your safety comes first</strong><p>Always confirm with your doctor or pharmacist before switching medicines. Prices are approximate.</p><small>Matching ingredients alone do not establish interchangeability. Amoxicillin is an antibiotic; use only as prescribed.</small></div></aside>
    </section>
  </div>;
}
```

## frontend/src/pages/NotFound.jsx

```jsx
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return <section className="container empty-state not-found"><span className="empty-icon"><Icon name="search" size={36} /></span><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>This page took a wrong turn.</h1><p>Let’s get you back to clearer medicine choices.</p><div className="actions"><Link className="button" to="/">Back to home</Link><Link className="button secondary" to="/search">Find medicine</Link></div></section>;
}
```

## frontend/src/data/medicines.js

```javascript
// Sample data for prototype, real data will come from the DRAP database.
// Illustrative fixtures, not verified brand/manufacturer/price records.
// Local/Sample brands and manufacturers are fictional; no clinical equivalence is asserted.
// SECURITY: Future medicine records must be validated and authorized by the backend.
export const medicines = [
  { id: 1, brand: 'Panadol', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'Haleon (sample)', pack: '10 tablets', price: 40 },
  { id: 2, brand: 'Calpol', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'GSK (sample)', pack: '10 tablets', price: 30 },
  { id: 3, brand: 'Paracetamol Local', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'Sample Pharma A', pack: '10 tablets', price: 20 },
  { id: 4, brand: 'Brufen', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Abbott (sample)', pack: '10 tablets', price: 80 },
  { id: 5, brand: 'Ibuprofen Local', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Sample Pharma B', pack: '10 tablets', price: 50 },
  { id: 6, brand: 'Ibu Sample', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Sample Pharma C', pack: '10 tablets', price: 60 },
  { id: 7, brand: 'Losec', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'AstraZeneca (sample)', pack: '14 capsules', price: 420 },
  { id: 8, brand: 'Risek', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'Getz Pharma (sample)', pack: '14 capsules', price: 280 },
  { id: 9, brand: 'Omeprazole Local', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'Sample Pharma A', pack: '14 capsules', price: 180 },
  { id: 10, brand: 'Zyrtec', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'UCB (sample)', pack: '60 mL bottle', price: 180 },
  { id: 11, brand: 'Cetirizine Local', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'Sample Pharma B', pack: '60 mL bottle', price: 100 },
  { id: 12, brand: 'Ceti Sample', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'Sample Pharma C', pack: '60 mL bottle', price: 130 },
  { id: 13, brand: 'Amoxil', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'GSK (sample)', pack: '12 capsules', price: 360 },
  { id: 14, brand: 'Amoxicillin Local', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'Sample Pharma A', pack: '12 capsules', price: 240 },
  { id: 15, brand: 'Amoxi Sample', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'Sample Pharma B', pack: '12 capsules', price: 300 },
];
// Compare like-for-like packs; a shared formula alone is insufficient.
export function comparisonKey(item) {
  return [item.formula, item.strength, item.form, item.pack].join('|');
}
```

## frontend/src/styles/app.css

```css
.container { width: min(1160px, calc(100% - 40px)); margin-inline: auto; }
.site-header { position: sticky; top: 0; z-index: 20; background: #fffffff5; border-bottom: 1px solid var(--border); }
.nav-wrap { min-height: 84px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { display: inline-flex; align-items: center; gap: 0; color: var(--ink); font-size: 27px; font-weight: 800; text-decoration: none; letter-spacing: -1px; }
.brand > span:nth-child(2) { color: var(--primary); }
.brand-mark { display: grid; place-items: center; width: 38px; height: 38px; margin-right: 9px; background: var(--primary); border-radius: 11px; color: white; }
.brand .country { font-size: 9px; letter-spacing: 1.7px; margin: 6px 0 0 12px; font-weight: 600; color: var(--muted); }
.navigation { display: none; }
.navigation.is-open { display: flex; position: absolute; top: 84px; left: 0; right: 0; padding: 24px; flex-direction: column; align-items: stretch; gap: 20px; background: white; box-shadow: var(--shadow); border-bottom: 1px solid var(--border); }
.navigation > a:not(.button) { text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 600; }
.navigation > a.active:not(.button) { color: var(--primary-dark); text-decoration: underline; text-underline-offset: 8px; }
.welcome { color: var(--muted); max-width: 180px; overflow-wrap: anywhere; font-size: 13px; }
.button { display: inline-flex; justify-content: center; align-items: center; gap: 12px; padding: 15px 22px; min-height: 48px; background: var(--primary); border: 1px solid var(--primary); color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 650; }
.button:hover:not(:disabled) { background: var(--primary-dark); box-shadow: 0 5px 14px #075b5120; }
.button.secondary { background: white; color: var(--primary-dark); border-color: var(--border); }
.button.secondary:hover { background: var(--mint); }
.button.small { padding: 10px 20px; min-height: 42px; }
.icon-button { border: 0; background: transparent; min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; color: var(--muted); gap: 6px; }
.icon-button:hover { background: var(--mint); border-radius: 6px; }
.hero { background: radial-gradient(ellipse at 85% 30%, #e7f3dd 0, transparent 48%), linear-gradient(120deg, #f7faf9, #edf6f1); padding: 54px 0 48px; overflow: hidden; }
.hero-grid { display: grid; gap: 48px; align-items: center; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; color: var(--primary-dark); font-size: 10px; font-weight: 750; letter-spacing: 1.5px; line-height: 1.7; }
.status-dot { height: 7px; width: 7px; border-radius: 50%; background: var(--primary); }
.hero h1 { font-size: clamp(40px, 5vw, 62px); line-height: 1.08; margin: 24px 0; font-weight: 650; }
em { font-style: normal; color: var(--primary); }
.hero-copy > p { max-width: 470px; color: var(--muted); font-size: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 28px 0 22px; }
.hero-note { display: flex; gap: 8px; align-items: center; color: var(--muted); font-size: 12px; }
.hero-visual { position: relative; padding: 12px 4px 0; }
.comparison-preview { background: white; border: 1px solid #dce7df; border-radius: 18px; padding: 22px; box-shadow: 0 25px 65px #24564418; transform: rotate(-2deg); }
.preview-heading { display: flex; gap: 12px; align-items: center; padding-bottom: 22px; border-bottom: 1px solid var(--border); }
.preview-heading > span:nth-child(2) { font-size: 8px; letter-spacing: 1px; color: var(--muted); }
.preview-heading strong { display: block; margin-top: 6px; font-size: 15px; letter-spacing: -.3px; color: var(--ink); }
.preview-dot { margin-left: auto; color: var(--primary); }
.medicine-icon { background: var(--mint); color: var(--primary); width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; }
.preview-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding: 16px 10px; font-size: 14px; }
.preview-row small, .preview-row strong { display: block; }
.preview-row small { color: var(--muted); font-size: 11px; margin-top: 7px; }
.preview-row.selected { border: 1px solid #9bc9af; background: #f2f8ec; border-radius: 10px; }
.preview-row .best-label { margin-bottom: 10px; font-size: 9px; }
.preview-row .badge { margin-top: 8px; }
.preview-bottom { color: var(--muted); font-size: 10px; display: flex; align-items: center; gap: 8px; padding: 20px 0 0; }
.floating-note { position: relative; display: flex; align-items: center; gap: 12px; margin: 8px -4px 0 14px; padding: 16px; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); }
.floating-note > span { color: var(--primary); padding: 8px; border-radius: 50%; background: var(--saving); }
.floating-note strong { display: block; font-size: 12px; }
.floating-note small { display: block; margin-top: 5px; color: var(--muted); font-size: 10px; }
.visual-caption { font-size: 10px; color: var(--muted); text-align: center; margin: 20px 0 0; }
.assurance-strip { background: white; border-block: 1px solid var(--border); }
.assurance-strip .container { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px; padding-block: 24px; }
.assurance-strip span { display: inline-flex; align-items: center; gap: 10px; font-size: 12px; color: var(--muted); }
.assurance-strip svg { color: var(--primary); }
.section { padding-block: 64px; }
.section-heading { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 14px; align-items: center; margin-bottom: 28px; }
h2 { font-size: clamp(25px, 3vw, 34px); font-weight: 650; }
.section-heading h2 { margin: 10px 0 0; }
.section-heading p { color: var(--muted); font-size: 13px; margin: 0; }
.three-grid, .medicine-grid { display: grid; gap: 20px; }
.step-card { padding: 28px; border: 1px solid var(--border); border-radius: 12px; background: white; }
.step-card > div { display: flex; justify-content: space-between; color: var(--primary); margin-bottom: 27px; align-items: center; }
.step-number { font-size: 13px; background: var(--mint); border-radius: 50%; padding: 10px; }
.step-card h3 { font-size: 19px; }
.step-card p { font-size: 14px; color: var(--muted); margin-bottom: 0; }
.why-section { display: grid; gap: 30px; background: #edf5ef; border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-bottom: 28px; }
.why-section h2 { margin: 12px 0 18px; }
.why-section p { font-size: 14px; color: var(--muted); }
.text-link { font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
.why-list { display: grid; gap: 24px; }
.why-list article { display: flex; gap: 16px; }
.why-list svg { color: var(--primary); margin-top: 3px; }
.why-list h3 { font-size: 17px; margin-bottom: 7px; line-height: 1.5; }
.why-list p { margin-bottom: 0; }
.badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 650; letter-spacing: 0; color: var(--primary-dark); border-radius: 5px; padding: 5px 8px; background: #deeee6; vertical-align: middle; }
.savings { background: var(--saving); color: #385b18; }
.sample-note { color: var(--muted); font-size: 12px; line-height: 1.65; margin-bottom: 36px; display: flex; align-items: flex-start; gap: 10px; }
.sample-note svg { margin-top: 2px; }
.site-footer { border-top: 1px solid var(--border); background: white; padding: 32px 0; }
.footer-row { display: flex; flex-wrap: wrap; gap: 26px; align-items: center; justify-content: space-between; }
.footer-brand { gap: 7px; font-size: 20px; }
.footer-row p { margin: 7px 0 0; font-size: 11px; color: var(--muted); }
.footer-row nav { display: flex; gap: 24px; }
.footer-row nav a { font-size: 12px; text-decoration: none; }
main { min-height: calc(100vh - 224px); }
main:focus { outline: none; }
.skip-link { position: fixed; top: -100px; left: 20px; z-index: 100; padding: 14px; background: white; }
.skip-link:focus { top: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.auth-layout { display: grid; gap: 36px; align-items: center; padding-block: 48px; }
.auth-story h1 { font-size: clamp(34px, 4vw, 49px); margin: 20px 0; line-height: 1.17; }
.auth-story > p { color: var(--muted); max-width: 410px; }
.auth-illustration { display: flex; align-items: center; gap: 22px; padding: 28px 0; color: var(--primary); }
.auth-illustration p { max-width: 290px; font-size: 13px; color: var(--muted); margin: 8px 0 0; }
.auth-card { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 28px; box-shadow: var(--shadow); }
.auth-card h2 { margin: 10px 0; font-size: 29px; }
.auth-card > p { color: var(--muted); font-size: 13px; }
.auth-tabs { display: flex; padding: 4px; border-radius: 8px; background: var(--background); margin-block: 24px 16px; border: 1px solid var(--border); }
.auth-tabs button { flex: 1; min-height: 42px; border: 0; border-radius: 5px; background: transparent; color: var(--muted); font-weight: 650; }
.auth-tabs .selected { background: white; box-shadow: 0 2px 6px #173e3912; color: var(--primary-dark); }
.auth-card .demo-note { background: var(--mint); border-radius: 8px; padding: 12px; font-size: 11px; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
label { font-size: 12px; font-weight: 650; color: var(--ink); }
input, select { border: 1px solid #afc5bd; background: white; color: var(--ink); border-radius: 7px; min-height: 46px; padding: 11px 12px; width: 100%; min-width: 0; }
input::placeholder { color: #657b74; }
input[aria-invalid='true'] { border-color: var(--error); }
.field-error { color: var(--error); font-size: 12px; line-height: 1.6; }
.field-hint, .fine-print { color: var(--muted); font-size: 11px; line-height: 1.6; }
.password-wrap { position: relative; }
.password-wrap input { padding-right: 92px; }
.password-wrap button { position: absolute; right: 4px; top: 1px; font-size: 11px; padding-inline: 10px; }
.full-width { width: 100%; }
.form-status p { margin: 12px 0 0; font-size: 13px; }
.privacy-note { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 20px 0 8px; text-align: center; }
.auth-card > .fine-print { font-size: 11px; text-align: center; margin: 0; }
.search-heading { padding: 46px 0 32px; background: #edf5ef; border-bottom: 1px solid var(--border); }
.search-heading h1 { margin: 14px 0; font-size: clamp(32px, 4vw, 44px); }
.search-heading p { color: var(--muted); font-size: 14px; }
.search-box { max-width: 740px; margin-top: 26px; }
.search-input { display: flex; align-items: center; gap: 12px; padding: 5px 8px 5px 18px; border: 1px solid #afc5bd; background: white; border-radius: 10px; margin-top: 9px; color: var(--primary); }
.search-input:focus-within { outline: 3px solid #986700; outline-offset: 3px; }
.search-input input { border: 0; outline: none; min-height: 48px; padding-inline: 0; }
.search-input input::-webkit-search-cancel-button { display: none; }
.search-meta { display: flex; justify-content: space-between; gap: 20px; margin-top: 9px; font-size: 11px; color: var(--muted); }
.search-meta span:last-child { white-space: nowrap; }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 17px; color: var(--muted); font-size: 11px; }
.suggestions button { background: white; border: 1px solid var(--border); color: var(--primary-dark); border-radius: 20px; padding: 8px 12px; min-height: 36px; font-size: 11px; }
.suggestions button:hover { background: var(--saving); }
.results-section { padding-block: 26px 46px; }
.filter-row { display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.filter-row h2 { font-size: 23px; margin-bottom: 8px; }
.filter-row p { font-size: 12px; color: var(--muted); margin: 0; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; }
.filters .field { margin: 0; flex: 1; min-width: 140px; }
.filters select { font-size: 12px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 54px 20px; border: 1px dashed var(--border); background: white; border-radius: 12px; min-height: 300px; }
.empty-state h2, .empty-state h3 { font-size: 24px; margin: 22px 0 12px; }
.empty-state p { font-size: 14px; color: var(--muted); }
.empty-icon { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%; color: var(--primary); background: var(--mint); margin-bottom: 8px; }
.formula-group { margin-bottom: 30px; }
.formula-banner { display: flex; gap: 14px; align-items: center; background: #e9f3ee; border: 1px solid var(--border); padding: 20px; border-radius: 10px; }
.formula-banner h2 { margin: 3px 0 6px; font-size: 25px; }
.formula-banner p { margin: 0; color: var(--muted); font-size: 12px; }
.comparison-caption { color: var(--muted); font-size: 11px; margin: 13px 0 20px; }
.medicine-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 3px 12px #173e3905; }
.medicine-card:hover { box-shadow: var(--shadow); }
.medicine-card.best-value { border-color: #6c9f64; background: #fcfef8; }
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.medicine-title { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.medicine-title h3 { font-size: 22px; margin: 0; }
.best-label { display: inline-flex; align-items: center; gap: 3px; color: #386622; font-weight: 700; font-size: 10px; }
.formula { margin-bottom: 14px; font-size: 13px; color: var(--muted); }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tags span { background: #f0f4f2; padding: 5px 8px; font-size: 10px; color: var(--muted); border-radius: 4px; }
dl { font-size: 11px; margin-block: 22px; }
dl > div { display: flex; justify-content: space-between; gap: 14px; margin-top: 10px; }
dt { color: var(--muted); }
dd { margin: 0; text-align: right; }
.price-row { border-top: 1px solid var(--border); padding-top: 18px; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.price-row strong { display: block; font-size: 25px; margin-top: 4px; color: var(--primary-dark); }
.safety-note { display: flex; gap: 14px; background: #eef4f1; border: 1px solid var(--border); border-radius: 10px; padding: 21px; margin-top: 28px; font-size: 13px; }
.safety-note svg { color: var(--primary); }
.safety-note p { margin: 6px 0; font-size: 12px; color: var(--muted); }
.safety-note small { font-size: 11px; color: var(--muted); line-height: 1.6; }
.not-found { margin-block: 60px; }
.not-found h1 { margin: 20px 0 0; font-size: clamp(30px, 5vw, 46px); }
@media (min-width: 650px) {
  .container { width: min(1160px, calc(100% - 64px)); }
  .hero-visual { max-width: 490px; width: 100%; margin-inline: auto; }
  .three-grid { grid-template-columns: repeat(3, 1fr); }
  .medicine-grid { grid-template-columns: repeat(2, 1fr); }
  .step-card { padding: 22px; }
  .auth-card { padding: 36px; }
  .filters { min-width: 340px; }
}
@media (min-width: 950px) {
  .menu-toggle { display: none; }
  .navigation, .navigation.is-open { display: flex; position: static; flex-direction: row; align-items: center; gap: 32px; padding: 0; background: transparent; box-shadow: none; border: 0; }
  .hero { padding-block: 74px; }
  .hero-grid { grid-template-columns: 1.1fr 1fr; gap: 64px; }
  .hero-visual { padding-left: 12px; }
  .comparison-preview { padding: 26px; }
  .floating-note { margin-right: -12px; margin-left: 30px; }
  .why-section { grid-template-columns: 1fr 1.2fr; gap: 74px; padding: 46px; }
  .auth-layout { grid-template-columns: 1fr 1fr; gap: 80px; padding-block: 64px; }
  .medicine-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 380px) {
  .container { width: calc(100% - 28px); }
  .brand .country { display: none; }
  .hero h1 { font-size: 36px; }
  .auth-card, .why-section { padding: 20px; }
  .comparison-preview { padding: 16px; }
}
```

## frontend/vercel.json

```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

## frontend/public/_redirects

```text
/* /index.html 200
```

## frontend/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/genmed.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="GenMed Pakistan patient prototype. Explore matching medicine formulas and illustrative price comparisons." />
    <title>GenMed | Medicine choices, made clearer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## frontend/public/genmed.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="#08796b"/><path d="M16 8h8v8h8v8h-8v8h-8v-8H8v-8h8z" fill="white"/></svg>
```

## SECURITY_NOTES.md

```markdown
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
```

## PowerShell setup and running

Ye folders aur files is workspace mein pehle hi bana diye gaye hain. Agar kisi doosre folder mein code copy kar rahe hain, yeh commands chala sakte hain:

```powershell
Set-Location D:\genmed\frontend
New-Item -ItemType Directory -Force -Path src\context, src\components, src\pages, src\data, src\styles, public | Out-Null
npm run dev
```

Terminal mein diya gaya local URL browser mein kholein. Server band karne ke liye Ctrl+C dabayein. Doosre PowerShell terminal mein production build aur code check karein:

```powershell
Set-Location D:\genmed\frontend
npm run lint
npm run build
npm run preview
```

Agar PowerShell npm.ps1 ko execution policy ki wajah se block kare, `npm.cmd run dev`, `npm.cmd run lint`, `npm.cmd run build`, aur `npm.cmd run preview` use karein. Execution policy badalne ki zaroorat nahin.

## Roman Urdu explanation

- Home se Find Cheaper Medicine dabane par pehle Login khulta hai. Login/Register ke baad Search page khulta hai.
- Demo mein apni asli email ya password istemal na karein. Koi bhi made-up valid email aur 8–128 character ka naya password chalega, jis mein uppercase, lowercase aur number ho. Yeh actual authentication nahin hai.
- Login fail karne ke liye email ka end `.invalid` rakhein. Password rules poore hon tab bhi generic error aayega. Paanch failures par 30 seconds ka cooldown lagta hai. Invalid form submissions bhi count hoti hain.
- Registration sirf demo session banati hai. Koi permanent account nahin banta. Refresh karne se logout ho jana is activity mein expected hai.
- Password React context ya localStorage mein save nahin hota. Sirf form mein temporary rehta hai aur submit ke baad clear ho jata hai.
- Search 350 milliseconds ruk kar results update karta hai. Isay debounce kehte hain. Spaces aur capital/small letters results ko affect nahin karte.
- Brand match hone par usi formula, strength, form aur pack size ke tamam sample options aate hain. Original match par Search match tag hota hai.
- Savings ka formula `(highestPrice - price) / highestPrice * 100` hai. Panadol group mein 40, 30 aur 20 PKR par 0%, 25% aur 50% savings milti hain. Best Value sirf sab se kam sample price hai.
- AuthContext session aur attempts sambhalta hai. ProtectedRoute sirf UI guard hai. Asli permissions aur security FastAPI backend mein lagen gi.
- Har page navbar/footer se connected hai. Mobile par hamburger menu khulta hai. Plain CSS aur inline SVG use hue hain; koi UI package ya external image/CDN nahin.

## Vercel or Netlify deployment

Local frontend is complete. A public deployment and another group member's usability test are still required by the activity PDF; neither is claimed as completed here.

1. Push the project to your chosen Git repository, keeping node_modules and dist excluded as usual.
2. Import that repository in either Vercel or Netlify.
3. Set the Vercel Root Directory or Netlify Base directory to `frontend`. Use the Vite preset, build command `npm run build`, and output/publish directory `dist`. No environment variables or secrets are required.
4. Vercel uses frontend/vercel.json within the selected frontend root. Vite copies public/_redirects into dist/_redirects for Netlify.
5. Deploy, save the resulting public URL, and test direct visits and refresh on `/`, `/login`, `/search`, and a made-up route. Refresh on `/search` should open Login because demo state resets; it should not show the hosting provider's 404.

These build and deployment settings follow the [official Vite static deployment guide](https://vite.dev/guide/static-deploy.html).

Roman Urdu: `npm run build` se `dist` folder banta hai. Hosting platform par isi folder ko publish karein. Localhost URL public submission URL nahin hota. Deployment ke baad milne wala public URL instructor ko dena hai.

## Submission details to fill after deployment

- Project: GenMed — Generic Medicine Alternative Finder System for Pakistan
- Group members from proposal: Ammar Ahmad (23P-3071), Muhammad Aamir (23F-3073)
- Primary user role: Patient
- Pages: Home, Login/Register, Medicine Search, friendly 404
- JavaScript interactions: debounced live search, validation, password visibility, dosage filter, price sorting, mobile menu, character counter, mock login cooldown
- Public URL: fill in after deployment
- Peer tester: fill in after a group member tries the site
- Problem discovered by peer: record the actual observed problem
- Improvement made: record the actual fix, then retest

Do not report a peer test or a live deployment that has not happened.

## Manual test checklist

### Home and navigation

- [ ] Open `/`: GenMed name, purpose, hero, how-it-works, Why GenMed, sample label, and footer appear.
- [ ] Click navbar logo and Home, hero Find Cheaper Medicine and Login, and Explore medicine options.
- [ ] Click footer GenMed, Home, Account, and Find medicine on every page.
- [ ] When signed out, all medicine-search links redirect to `/login`; after signing in they open `/search`.
- [ ] Check browser Back/Forward navigation and route-specific page titles.
- [ ] Open an unknown URL: friendly 404 appears; Back to home and Find medicine work.
- [ ] On mobile, open and close the hamburger menu; check aria-expanded and Escape; selecting a link closes it.

### Login and registration

- [ ] Submit empty Login: email/password guidance and generic `Invalid email or password.` appear.
- [ ] Try malformed email, fewer than 8 characters, missing uppercase/lowercase/number, and whitespace-only fields.
- [ ] Confirm email max 254, name max 80, and password max 128 characters.
- [ ] Toggle Show/Hide password by keyboard and pointer; confirm aria-label, aria-pressed, and input type change.
- [ ] Switch to Register: only full name, email, password, and confirmation are collected.
- [ ] Confirm `current-password` on Login and `new-password` on both Register password fields.
- [ ] Submit blank name or mismatched passwords: clear inline errors appear.
- [ ] Submit valid Login and Register: confirmation appears, inputs clear, and `/search` opens.
- [ ] Registration trims the name and shows it in the navbar welcome line; Login uses Patient.
- [ ] No permanent account is created; successful Login does not require a prior registration.
- [ ] Privacy note is visible; no role selector or unnecessary sensitive fields exist.

### Throttle and session security

- [ ] Use a syntactically valid `.invalid` email and a valid throwaway password five times; each failure is generic.
- [ ] After the fifth attempt, the entire form and mode toggle disable for 30 seconds with a countdown.
- [ ] Navigate Home then Login during cooldown: it remains active. After 30 seconds, submit is available again.
- [ ] Successful sign-in resets the failed-attempt count.
- [ ] Refresh `/search`: session is lost and Login opens.
- [ ] Logout from Search removes the welcome line and redirects to Login. Browser Back cannot restore access.
- [ ] DevTools Application shows no app credentials, tokens, emails, or passwords in localStorage/sessionStorage/cookies.
- [ ] Submitting forms makes no authentication network request; browser console contains no sensitive logs.
- [ ] Explain that refresh can bypass client throttling and frontend route guards; server controls remain mandatory.

### Medicine search

- [ ] Before searching, a helpful starting state appears.
- [ ] Search `  pAnAdOl  `: after the short searching state, Paracetamol is prominent and three matching options appear.
- [ ] Verify every card includes brand, formula, strength, dosage form, manufacturer, pack, PKR price, and savings.
- [ ] Check prices 20/30/40 PKR and savings 50%/25%/0%; lowest card is Best Value and original brand is Search match.
- [ ] Search by each formula: Paracetamol, Ibuprofen, Omeprazole, Cetirizine, Amoxicillin.
- [ ] Test each suggestion button: Panadol, Ibuprofen, Omeprazole.
- [ ] Sort low-to-high and high-to-low within each formula group; savings and Best Value remain unchanged.
- [ ] Test Tablet, Capsule, Syrup, and All forms filters, including a filter with no matching options.
- [ ] Click Show all forms from the filtered empty state.
- [ ] Search a misspelled name: `No medicine found, check spelling` appears; Clear search resets it.
- [ ] Test the clear icon on a successful search and whitespace-only input.
- [ ] Type or paste over 50 characters: input stops at 50 and counter reads 50/50.
- [ ] Type quickly: only the latest search determines results after debounce, with no stale cards shown while searching.
- [ ] Paste HTML-like input: it is treated as text and never executed.
- [ ] Confirm the prototype/DRAP notice and exact doctor/pharmacist disclaimer remain visible in all result states.

### Accessibility, responsive layout, and deployment

- [ ] Tab through all controls with visible focus; activate buttons using keyboard and use Skip to content.
- [ ] Check screen-reader labels, error associations, result announcements, and meaningful headings.
- [ ] Test phone, tablet, and laptop widths; no horizontal scrolling, cut-off text, or overlapping controls.
- [ ] Check browser console and network panel for errors, warnings, missing resources, and broken links.
- [ ] Run `npm run lint` and `npm run build` successfully.
- [ ] Deploy and open the public URL in a second browser/device.
- [ ] Refresh all routes on the public host to verify SPA rewrites, including a friendly unknown route.
- [ ] Ask another group member to use the site without coaching; record one real problem and the improvement made.
