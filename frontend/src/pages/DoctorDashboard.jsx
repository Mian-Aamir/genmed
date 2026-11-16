import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewSummary from '../components/ReviewSummary';
import Icon from '../components/Icon';
import { REVIEW_NOTE_MAX, validateReview } from '../services/requestValidation';

function ReviewCard({ request }) {
  const { decideReview } = useAuth();
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = String(new FormData(form).get('decision') || '');
    // Activity 5 Task 1: validate first and show an accessible message under each field.
    const validation = validateReview(status, note);
    setErrors(validation.errors);
    if (!validation.ok) {
      setResult(null);
      form.elements.namedItem(validation.errors.decision ? 'decision' : 'note')?.focus();
      return;
    }
    // Activity 6: PATCH /api/reviews/:id. The server checks the doctor role and validates again.
    setSaving(true);
    const outcome = await decideReview(request.id, status, note);
    setSaving(false);
    setResult(outcome);
    if (outcome.errors) setErrors(outcome.errors);
    if (outcome.ok) setNote('');
  }
  return <article className="dashboard-panel">
    <ReviewSummary request={request} />
    <p className="fine-print">Patient reference: {request.patientReference}<br />Contact: {request.maskedEmail} (masked)</p>
    <div className="internal-note"><strong>Doctor-only internal note</strong>{/* SECURITY: Doctor notes are user input, rendered as escaped React text. */}<p>{request.internalNote || 'No internal note yet.'}</p></div>
    {request.status === 'pending' && <form onSubmit={submit} noValidate>
      <div className="field"><label htmlFor={`decision-${request.id}`}>Review decision</label>
        <select id={`decision-${request.id}`} name="decision" defaultValue="" required aria-invalid={Boolean(errors.decision)} aria-describedby={`decision-error-${request.id}`} onChange={() => setErrors(previous => ({ ...previous, decision: undefined }))}>
          <option value="" disabled>Choose a decision</option>
          <option value="reviewed">Mark reviewed</option>
          <option value="discussion">Needs discussion</option>
        </select>
        <span id={`decision-error-${request.id}`} className="field-error">{errors.decision}</span>
      </div>
      <div className="field"><label htmlFor={`note-${request.id}`}>Internal note</label>
        {/* SECURITY: autoComplete off so internal clinical notes are not kept in browser form history. */}
        <textarea id={`note-${request.id}`} name="note" value={note} onChange={event => { setNote(event.target.value.slice(0, REVIEW_NOTE_MAX)); setErrors(previous => ({ ...previous, note: undefined })); }} maxLength={REVIEW_NOTE_MAX} rows={3} required autoComplete="off" aria-invalid={Boolean(errors.note)} aria-describedby={`note-help-${request.id} note-error-${request.id}`} />
        <span id={`note-help-${request.id}`} className="field-hint">{note.length}/{REVIEW_NOTE_MAX} · Required, 1–300 characters. Visible to doctors only.</span>
        <span id={`note-error-${request.id}`} className="field-error">{errors.note}</span>
      </div>
      <button type="submit" className="button" disabled={saving}>{saving ? 'Saving…' : 'Save review'}</button>
    </form>}
    <p role="status" className={result?.ok ? 'success-message' : 'field-error'}>{result?.message}</p>
  </article>;
}

export default function DoctorDashboard() {
  const { user, requests, loadReviews } = useAuth();
  // Activity 6: always show the latest queue from GET /api/reviews when the page opens.
  useEffect(() => { loadReviews(); }, [loadReviews]);
  const [filter, setFilter] = useState('all');
  const visible = requests.filter(request => filter === 'all' || request.status === filter);
  const pending = requests.filter(request => request.status === 'pending').length;
  return <section className="container dashboard-page">
    <span className="eyebrow">DOCTOR WORKSPACE</span>
    <h1>Welcome, {user.name}</h1>
    <p className="dashboard-intro">Review requests, record decisions, and keep internal notes within your role’s view.</p>
    <div className="dashboard-actions"><span className="badge">{pending} pending requests</span><span className="badge">{requests.length - pending} completed reviews</span></div>
    <aside className="safety-note"><Icon name="shield" /><p>A review here is guidance for the patient, not a prescription. Confirm treatment changes through a proper clinical consultation.</p></aside>
    <div className="filter-row request-section"><h2>Review queue</h2><div className="field">
      <label htmlFor="review-filter">Filter requests</label>
      <select id="review-filter" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All requests</option><option value="pending">Pending review</option><option value="reviewed">Reviewed</option><option value="discussion">Needs discussion</option>
      </select>
    </div></div>
    <p role="status" className="fine-print">{visible.length} requests shown. Patient contact details are masked.</p>
    <div className="review-grid">{visible.map(request => <ReviewCard key={request.id} request={request} />)}</div>
    {!visible.length && <p className="empty-state">No requests in this category.</p>}
  </section>;
}
