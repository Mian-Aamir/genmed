import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../services/requestStore';
import { validateRequest } from '../services/requestValidation';
import SecureFileSelection from '../components/SecureFileSelection';
import '../styles/request.css';

const emptyFields = { medicine: '', category: '', quantity: '', notes: '' };

export default function RequestMedicine() {
  const { user, api } = useAuth();
  const [fields, setFields] = useState({ ...emptyFields });
  const [feedback, setFeedback] = useState(null);
  // Remounts the file selection after a successful request so no file stays selected.
  const [fileKey, setFileKey] = useState(0);
  // Activity 6: requests come from GET /api/requests (stored in SQLite), not from browser memory.
  const [result, setResult] = useState({ ok: true, loading: true, requests: [] });
  const [submitting, setSubmitting] = useState(false);
  const requests = result.ok ? result.requests : [];
  const errors = feedback?.errors || {};

  // Changing reloadKey re-fetches the list (for example after a successful submit).
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api('/requests', { signal: controller.signal }).then(response => {
      if (response.aborted) return;
      setResult(response.ok
        ? { ok: true, loading: false, requests: response.data.requests }
        : { ok: false, loading: false, requests: [], message: response.message });
    });
    return () => controller.abort();
  }, [api, reloadKey]);

  function changeField(event) {
    const { name, value } = event.target;
    setFields(previous => ({ ...previous, [name]: value }));
    setFeedback(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const focusFirst = fieldErrors => form.elements.namedItem(Object.keys(fieldErrors)[0])?.focus();
    // Activity 5 Task 1: validate in the browser first for quick feedback...
    const validation = validateRequest(fields, CATEGORIES);
    if (!validation.ok) {
      setFeedback({ ok: false, message: 'Please check the highlighted fields', errors: validation.errors });
      focusFirst(validation.errors);
      return;
    }
    // ...then Activity 6: POST /api/requests. The server validates again and sets the owner,
    // patient name, date and status from the JWT, never from the form.
    setSubmitting(true);
    const response = await api('/requests', { method: 'POST', body: validation.values });
    setSubmitting(false);
    setFeedback({ ok: response.ok, message: response.message, errors: response.data?.errors });
    if (response.ok) {
      setFields({ ...emptyFields });
      setFileKey(previous => previous + 1);
      setReloadKey(previous => previous + 1);
    } else if (response.data?.errors) {
      focusFirst(response.data.errors);
    }
  }

  // SECURITY: React escapes all displayed request text; never interpret notes as HTML.
  // Activity 5 Task 2: medicine names and notes are rendered as JSX text ({request.notes}),
  // which React inserts like textContent. No dangerouslySetInnerHTML, innerHTML or eval is used,
  // so input such as <script>alert('xss')</script> is displayed literally and never runs.
  return (
    <section className="container dashboard-page medicine-request-page">
      <span className="eyebrow">PATIENT WORKSPACE · MEDICINE REQUESTS</span>
      <h1>Submit Medicine Request</h1>
      <p className="dashboard-intro">Request a medicine or a generic alternative.</p>
      <div className="dashboard-actions">
        <Link className="button secondary" to="/patient">My dashboard</Link>
        <Link className="button secondary" to="/track">Track Requests</Link>
      </div>
      <p className="sample-note">Your requests are saved to your account. Submitting a request does not place an order or prescribe a medicine.</p>
      <div role="status" aria-live="polite" aria-atomic="true">
        {feedback && (
          <p className={feedback.ok ? 'request-success' : 'field-error'}>{feedback.message}</p>
        )}
      </div>
      <form className="dashboard-panel request-form" onSubmit={submit} noValidate>
        <h2>Request details</h2>
        <div className="field">
          <label htmlFor="patient-name">Patient Name</label>
          <input id="patient-name" value={user.name} readOnly aria-describedby="patient-name-help" />
          <span id="patient-name-help" className="field-hint">Taken from your signed-in account.</span>
        </div>
        <div className="field">
          <label htmlFor="medicine">Medicine Name</label>
          {/* SECURITY: autoComplete off so medicine names are not kept in browser form history. */}
          <input id="medicine" name="medicine" value={fields.medicine} onChange={changeField} maxLength={120} required autoComplete="off" aria-invalid={Boolean(errors.medicine)} aria-describedby="medicine-hint medicine-error" />
          <span id="medicine-hint" className="field-hint">Required, 3–120 characters. Letters, numbers, spaces and . , &apos; ( ) / % + - only.</span>
          <span id="medicine-error" className="field-error">{errors.medicine}</span>
        </div>
        <div className="request-form-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={fields.category} onChange={changeField} required aria-invalid={Boolean(errors.category)} aria-describedby="category-error">
              <option value="">Select a category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <span id="category-error" className="field-error">{errors.category}</span>
          </div>
          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" name="quantity" type="text" inputMode="numeric" value={fields.quantity} onChange={changeField} maxLength={6} required autoComplete="off" aria-invalid={Boolean(errors.quantity)} aria-describedby="quantity-error" />
            <span id="quantity-error" className="field-error">{errors.quantity}</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" value={fields.notes} onChange={changeField} maxLength={200} rows={3} autoComplete="off" aria-invalid={Boolean(errors.notes)} aria-describedby="notes-count notes-error" />
          <span id="notes-count" className="field-hint">{fields.notes.length}/200 characters</span>
          <span id="notes-error" className="field-error">{errors.notes}</span>
        </div>
        <SecureFileSelection key={fileKey} />
        <button className="button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</button>
      </form>
      <section className="request-section" aria-labelledby="own-requests-heading">
        <h2 id="own-requests-heading">My Requests</h2>
        <p className="fine-print">Newest first · {requests.length}/20 requests · Saved on the GenMed server.</p>
        {result.loading && <p role="status">Loading your requests…</p>}
        {!result.ok && <p role="alert" className="field-error">{result.message}</p>}
        {result.ok && !result.loading && requests.length === 0 && <p>No requests yet.</p>}
        <ul className="request-list">
          {requests.map(request => (
            <li className="dashboard-panel" key={request.id}>
              <div className="review-heading">
                <strong>{request.id}</strong>
                <span className="badge">{request.status}</span>
              </div>
              <h3>{request.medicine}</h3>
              <p>{request.category} · Quantity: {request.quantity}</p>
              <p className="fine-print">{request.patientName} · {request.date}</p>
              <p className="request-notes">{request.notes || 'No notes provided.'}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
