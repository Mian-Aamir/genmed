import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, addOwnRequest, listOwnRequests } from '../services/requestStore';
import '../styles/request.css';

const emptyFields = { medicine: '', category: '', quantity: '', notes: '' };

export default function RequestMedicine() {
  const { user } = useAuth();
  const [fields, setFields] = useState({ ...emptyFields });
  const [feedback, setFeedback] = useState(null);
  const result = listOwnRequests(user);
  const requests = result.ok ? result.requests : [];
  const errors = feedback?.errors || {};

  function changeField(event) {
    const { name, value } = event.target;
    setFields(previous => ({ ...previous, [name]: value }));
    setFeedback(null);
  }

  function submit(event) {
    event.preventDefault();
    // SECURITY: Use the current AuthContext session, never a form-supplied name or owner.
    const outcome = addOwnRequest(user, fields);
    setFeedback(outcome);
    if (outcome.ok) {
      setFields({ ...emptyFields });
    } else if (outcome.errors) {
      const firstField = Object.keys(outcome.errors)[0];
      event.currentTarget.elements.namedItem(firstField)?.focus();
    }
  }

  // SECURITY: React escapes all displayed request text; never interpret notes as HTML.
  return (
    <section className="container dashboard-page medicine-request-page">
      <span className="eyebrow">PATIENT WORKSPACE · MEDICINE REQUESTS</span>
      <h1>Submit Medicine Request</h1>
      <p className="dashboard-intro">Request a medicine or generic alternative in this classroom prototype.</p>
      <div className="dashboard-actions">
        <Link className="button secondary" to="/patient">My dashboard</Link>
        <Link className="button secondary" to="/track">Track Requests</Link>
      </div>
      <p className="sample-note">Demo only: no order is placed and no medicine is prescribed. Use fictional notes only.</p>
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
          <input id="medicine" name="medicine" value={fields.medicine} onChange={changeField} maxLength={120} required aria-invalid={Boolean(errors.medicine)} aria-describedby="medicine-error" />
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
            <input id="quantity" name="quantity" type="text" inputMode="numeric" value={fields.quantity} onChange={changeField} maxLength={6} required aria-invalid={Boolean(errors.quantity)} aria-describedby="quantity-error" />
            <span id="quantity-error" className="field-error">{errors.quantity}</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" value={fields.notes} onChange={changeField} maxLength={200} rows={3} aria-invalid={Boolean(errors.notes)} aria-describedby="notes-count notes-error" />
          <span id="notes-count" className="field-hint">{fields.notes.length}/200 characters</span>
          <span id="notes-error" className="field-error">{errors.notes}</span>
        </div>
        <button className="button" type="submit">Submit Request</button>
      </form>
      <section className="request-section" aria-labelledby="own-requests-heading">
        <h2 id="own-requests-heading">My Requests</h2>
        <p className="fine-print">Newest first · {requests.length}/20 requests, including samples. Data resets on refresh.</p>
        {!result.ok && <p role="alert">{result.message}</p>}
        {result.ok && requests.length === 0 && <p>No requests yet.</p>}
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
