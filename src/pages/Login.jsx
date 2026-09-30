import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import Icon from "../components/Icon";

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
    const email = String(fields.get("email") || "")
      .trim()
      .slice(0, 254);
    const name = String(fields.get("fullName") || "")
      .trim()
      .slice(0, 80);
    const password = String(fields.get("password") || "");
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (
      password.length < 8 ||
      password.length > 128 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    )
      next.password =
        "Use 8–128 characters with uppercase, lowercase, and a number.";
    if (register && !name) next.fullName = "Enter your full name.";
    if (register && password !== fields.get("confirmPassword"))
      next.confirmPassword = "Passwords must match.";
    // SECURITY: Reserved .invalid addresses simulate rejection without storing demo credentials.
    const rejected = !register && email.toLowerCase().endsWith(".invalid");
    if (Object.keys(next).length || rejected) {
      recordFailure();
      setErrors({
        ...next,
        form: register
          ? "Please check the highlighted fields."
          : "Invalid email or password.",
      });
      form.elements.namedItem("password").value = "";
      if (register) form.elements.namedItem("confirmPassword").value = "";
      form.elements.namedItem(Object.keys(next)[0] || "email")?.focus();
      return;
    }
    setErrors({});
    pending.current = true;
    setBusy(true);
    // SECURITY: Clear the form immediately. The delayed callback uses only the display name.
    form.reset();
    timer.current = window.setTimeout(() => {
      signIn(register ? name : "Patient");
    }, 800);
  }
  function toggle() {
    setRegister(!register);
    setErrors({});
  }
  return (
    <section className="container auth-layout">
      <aside className="auth-story">
        <span className="eyebrow">YOUR HEALTH. YOUR CHOICE.</span>
        <h1>
          A little knowledge.
          <br />
          <em>A little more peace of mind.</em>
        </h1>
        <p>
          Explore medicine options with clear formulas and straightforward
          sample prices.
        </p>
        <div className="auth-illustration">
          <Icon name="shield" size={60} />
          <div>
            <strong>Only the essentials.</strong>
            <p>
              No CNIC, address, or medical history needed for this prototype.
            </p>
          </div>
        </div>
        <p className="fine-print">
          A patient-focused prototype for more affordable care in Pakistan.
        </p>
      </aside>
      <div className="auth-card">
        <span className="eyebrow">LET’S GET STARTED</span>
        <h2>{register ? "Create your account" : "Welcome to GenMed"}</h2>
        <p>
          {register
            ? "Take the first step towards clearer medicine choices."
            : "Enter the demo to explore medicine alternatives."}
        </p>
        <div className="auth-tabs" role="group" aria-label="Account form">
          <button
            type="button"
            aria-pressed={!register}
            className={!register ? "selected" : ""}
            disabled={busy || remaining > 0}
            onClick={() => {
              if (register) toggle();
            }}
          >
            Login
          </button>
          <button
            type="button"
            aria-pressed={register}
            className={register ? "selected" : ""}
            disabled={busy || remaining > 0}
            onClick={() => {
              if (!register) toggle();
            }}
          >
            Register
          </button>
        </div>
        <p className="demo-note">
          Demo only: use a made-up email and a new, unused password. Any valid
          entry opens the demo; no account is stored. Login emails ending in{" "}
          <strong>.invalid</strong> simulate failure.
        </p>
        <form
          key={register ? "register" : "login"}
          noValidate
          onSubmit={submit}
          aria-busy={busy}
        >
          <fieldset disabled={busy || remaining > 0}>
            <legend className="sr-only">
              {register ? "Register" : "Login"} details
            </legend>
            {register && (
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  maxLength={80}
                  required
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby="name-error"
                />
                <span id="name-error" className="field-error">
                  {errors.fullName}
                </span>
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-error"
                placeholder="you@example.com"
              />
              <span id="email-error" className="field-error">
                {errors.email}
              </span>
            </div>
            <PasswordInput
              id="password"
              label="Password"
              newPassword={register}
              error={errors.password}
              hint="8–128 characters, including uppercase, lowercase, and a number."
            />
            {register && (
              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                newPassword
                error={errors.confirmPassword}
              />
            )}
            <button className="button full-width" type="submit">
              {busy
                ? "Opening your demo…"
                : register
                  ? "Create demo account"
                  : "Login to GenMed"}
              <Icon name="arrow" size={18} />
            </button>
          </fieldset>
          <div aria-live="polite" aria-atomic="true" className="form-status">
            {remaining > 0 ? (
              <p className="field-error">
                Too many attempts. Try again in {remaining} seconds.
              </p>
            ) : errors.form ? (
              <p className="field-error">{errors.form}</p>
            ) : busy ? (
              <p>Success! Taking you to medicine search…</p>
            ) : null}
          </div>
        </form>
        <p className="privacy-note">
          <Icon name="shield" size={16} /> We collect only what is needed to run
          your account.
        </p>
        <p className="fine-print">
          Your demo session ends when you refresh the page.
        </p>
      </div>
    </section>
  );
}
