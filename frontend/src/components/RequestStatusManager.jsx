// Module 2 (Ammar Ahmad), doctor view: every patient's medicine requests with a status control.
// Activity 6: GET /api/requests (a doctor receives all requests) and
// PATCH /api/requests/:reference/status. SECURITY: The server allows the PATCH only for the
// doctor role and allowlists the status. The checks here are for usability only.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { STATUSES } from '../services/requestStore';

function StatusCard({ request, onUpdated }) {
  const { api } = useAuth();
  const [status, setStatus] = useState(request.status);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const selectId = `status-${request.id}`;

  async function submit(event) {
    event.preventDefault();
    if (!STATUSES.includes(status)) {
      setResult({ ok: false, message: 'Choose a listed status.' });
      return;
    }
    if (status === request.status) {
      setResult({ ok: false, message: `This request is already ${request.status}.` });
      return;
    }
    setSaving(true);
    const response = await api(`/requests/${encodeURIComponent(request.id)}/status`, { method: 'PATCH', body: { status } });
    setSaving(false);
    setResult({ ok: response.ok, message: response.message || (response.ok ? 'Status updated.' : 'The status could not be updated.') });
    if (response.ok) onUpdated(response.data.request);
  }

  return <article className="dashboard-panel">
    <div className="review-heading"><span className="eyebrow">{request.id}</span><span className="badge">{request.status}</span></div>
    {/* SECURITY: All values are user input from the database, rendered as escaped React text. */}
    <h3>{request.medicine}</h3>
    <p>{request.category} · Quantity {request.quantity}</p>
    <p className="fine-print">Patient: {request.patientName}<br />Requested {request.date}</p>
    {request.notes && <p className="fine-print">Notes: {request.notes}</p>}
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={selectId}>Update status</label>
        <select id={selectId} value={status} onChange={event => { setStatus(event.target.value); setResult(null); }}>
          {STATUSES.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      <button type="submit" className="button" disabled={saving}>{saving ? 'Saving…' : 'Save status'}</button>
    </form>
    <p role="status" className={result?.ok ? 'success-message' : 'field-error'}>{result?.message}</p>
  </article>;
}

export default function RequestStatusManager() {
  const { api } = useAuth();
  const [state, setState] = useState({ loading: true, ok: true, requests: [], message: '' });
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const controller = new AbortController();
    api('/requests', { signal: controller.signal }).then(response => {
      if (response.aborted) return;
      setState(response.ok
        ? { loading: false, ok: true, requests: response.data.requests, message: '' }
        : { loading: false, ok: false, requests: [], message: response.message || 'Medicine requests could not be loaded.' });
    });
    return () => controller.abort();
  }, [api]);

  function replace(updated) {
    setState(previous => ({ ...previous, requests: previous.requests.map(item => (item.id === updated.id ? updated : item)) }));
  }

  const visible = state.requests.filter(request => filter === 'All' || request.status === filter);

  return <section className="request-section" aria-labelledby="medicine-requests-title">
    <div className="filter-row">
      <div>
        <h2 id="medicine-requests-title">Medicine requests</h2>
        <p>Requests submitted by patients. Update the status as each request is approved, dispatched and delivered.</p>
      </div>
      <div className="field">
        <label htmlFor="medicine-request-filter">Filter by status</label>
        <select id="medicine-request-filter" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="All">All statuses</option>
          {STATUSES.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    </div>
    {state.loading ? <p className="fine-print" role="status">Loading medicine requests…</p>
      : !state.ok ? <p className="field-error" role="alert">{state.message}</p>
        : <>
          <p role="status" className="fine-print">{visible.length} of {state.requests.length} medicine requests shown.</p>
          <div className="review-grid">{visible.map(request => <StatusCard key={request.id} request={request} onUpdated={replace} />)}</div>
          {!visible.length && <p className="empty-state">No medicine requests in this category.</p>}
        </>}
  </section>;
}
