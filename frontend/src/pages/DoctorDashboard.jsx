import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ReviewSummary from '../components/ReviewSummary';
import Icon from '../components/Icon';

function ReviewCard({ request }) {
  const { decideReview } = useAuth();
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  function submit(event) {
    event.preventDefault();
    const status = new FormData(event.currentTarget).get('decision');
    const outcome = decideReview(request.id, status, note);
    setResult(outcome);
    if (outcome.ok) setNote('');
  }
  return <article className="dashboard-panel">
    <ReviewSummary request={request} />
    <p className="fine-print">Patient reference: {request.patientReference}<br />Contact: {request.maskedEmail} (masked)</p>
    <div className="internal-note"><strong>Doctor-only internal note</strong><p>{request.internalNote || 'No internal note yet.'}</p></div>
    {request.status === 'pending' && <form onSubmit={submit}>
      <div className="field"><label htmlFor={`decision-${request.id}`}>Demo review decision</label>
        <select id={`decision-${request.id}`} name="decision" defaultValue="" required>
          <option value="" disabled>Choose a decision</option>
          <option value="reviewed">Mark reviewed (demo only)</option>
          <option value="discussion">Needs discussion</option>
        </select>
      </div>
      <div className="field"><label htmlFor={`note-${request.id}`}>Internal note</label>
        <textarea id={`note-${request.id}`} value={note} onChange={event => setNote(event.target.value.slice(0, 300))} maxLength={300} rows={3} required aria-describedby={`note-help-${request.id}`} />
        <span id={`note-help-${request.id}`} className="field-hint">{note.length}/300 · Use fictional information only. Visible to the Doctor role.</span>
      </div>
      <button type="submit" className="button">Save demo review</button>
    </form>}
    <p role="status" className={result?.ok ? 'success-message' : 'field-error'}>{result?.message}</p>
  </article>;
}

export default function DoctorDashboard() {
  const { user, requests } = useAuth();
  const [filter, setFilter] = useState('all');
  const visible = requests.filter(request => filter === 'all' || request.status === filter);
  const pending = requests.filter(request => request.status === 'pending').length;
  return <section className="container dashboard-page">
    <span className="eyebrow">DOCTOR WORKSPACE · FICTIONAL ACCOUNT</span>
    <h1>Welcome, {user.name}</h1>
    <p className="dashboard-intro">Review requests, record demo decisions, and keep internal notes within your role’s view.</p>
    <div className="dashboard-actions"><span className="badge">{pending} pending requests</span><span className="badge">{requests.length - pending} completed reviews</span></div>
    <aside className="safety-note"><Icon name="shield" /><p>No clinical verification takes place here. All records, accounts, and review decisions are fictional. Do not use this prototype for treatment decisions.</p></aside>
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
