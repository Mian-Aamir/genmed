import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STATUSES, getOwnRequest, listOwnRequests } from '../services/requestStore';
import {
  MAX_REFERENCE_LENGTH, filterRequests, isValidReferenceQuery, isValidStatus,
} from '../services/trackHelpers';
import '../styles/track.css';

export default function TrackRequests() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [statusError, setStatusError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const searchInput = useRef(null);
  const detailsHeading = useRef(null);
  const detailsTrigger = useRef(null);

  // SECURITY: Read only through session-scoped actions, including every detail lookup.
  // Re-read on render and route entry so Module 1 submissions appear without a reload.
  const result = listOwnRequests(user);
  const visible = result.ok ? filterRequests(result.requests, query, status) : [];
  const validQuery = isValidReferenceQuery(query);
  const detailResult = selectedId ? getOwnRequest(user, selectedId) : null;
  const detail = result.ok && detailResult?.ok ? detailResult.request : null;

  useEffect(() => {
    if (selectedId) detailsHeading.current?.focus();
  }, [selectedId]);

  function clearFilters() {
    setQuery('');
    setStatus('All');
    setStatusError('');
    setSelectedId(null);
    searchInput.current?.focus();
  }

  function changeStatus(event) {
    const value = event.target.value;
    setSelectedId(null);
    // SECURITY: Reject unknown values even if someone modifies the dropdown in the browser.
    if (!isValidStatus(value)) {
      setStatusError('Choose a listed status.');
      return;
    }
    setStatusError('');
    setStatus(value);
  }

  function closeDetails() {
    setSelectedId(null);
    detailsTrigger.current?.focus();
  }

  // SECURITY: All request fields are rendered as React text, never interpreted as HTML.
  return (
    <section className="container dashboard-page track-page">
      <span className="eyebrow">PATIENT WORKSPACE · MEDICINE REQUESTS</span>
      <h1>View and Track Medicine Requests</h1>
      <p className="dashboard-intro">Find your request by reference and follow its demo status.</p>
      <div className="dashboard-actions">
        <Link className="button" to="/request">Submit Request</Link>
        <Link className="button secondary" to="/patient">My dashboard</Link>
      </div>
      <p className="sample-note">Fictional demo records only. Requests stay in this tab and reset on refresh. Statuses do not confirm a real order or medical approval.</p>
      {!result.ok ? (
        <p role="alert" className="field-error">{result.message}</p>
      ) : (
        <>
          <section className="dashboard-panel" aria-labelledby="track-filters-heading">
            <h2 id="track-filters-heading">Find a request</h2>
            <div className="track-filters">
              <div className="field">
                <label htmlFor="track-reference">Search by reference</label>
                <input
                  ref={searchInput}
                  id="track-reference"
                  type="search"
                  value={query}
                  maxLength={MAX_REFERENCE_LENGTH}
                  placeholder="e.g. GM-1002"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!validQuery}
                  aria-describedby="track-reference-help"
                  onChange={event => {
                    // SECURITY: Bound input in the handler as well as the HTML attribute.
                    setQuery(event.target.value.slice(0, MAX_REFERENCE_LENGTH));
                    setSelectedId(null);
                  }}
                />
                <span id="track-reference-help" className={validQuery ? 'field-hint' : 'field-error'} aria-live="polite">
                  {validQuery ? 'Enter a full reference or a prefix such as GM-10.' : 'Use the format GM-1234'}
                </span>
              </div>
              <div className="field">
                <label htmlFor="track-status">Status</label>
                <select id="track-status" value={status} onChange={changeStatus} aria-invalid={Boolean(statusError)} aria-describedby="track-status-error">
                  <option value="All">All</option>
                  {STATUSES.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <span id="track-status-error" className="field-error" role="status">{statusError}</span>
              </div>
              <button type="button" className="button secondary" onClick={clearFilters}>Clear filters</button>
            </div>
          </section>
          {selectedId && (
            <section className="dashboard-panel track-details" aria-labelledby="track-details-heading">
              <div className="review-heading">
                <h2 id="track-details-heading" ref={detailsHeading} tabIndex={-1}>Request details</h2>
                <button type="button" className="button secondary small" onClick={closeDetails}>Close details</button>
              </div>
              {detail ? (
                <dl className="track-detail-grid">
                  {[
                    ['Reference', detail.id],
                    ['Patient', detail.patientName],
                    ['Medicine', detail.medicine],
                    ['Category', detail.category],
                    ['Quantity', detail.quantity],
                    ['Date', detail.date],
                    ['Status', detail.status],
                    ['Notes', detail.notes || 'No notes provided.'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p role="alert">{detailResult?.message || 'Request not found'}</p>
              )}
            </section>
          )}
          <section className="request-section" aria-labelledby="track-list-heading">
            <h2 id="track-list-heading">My Requests</h2>
            <p className="fine-print" role="status" aria-live="polite">
              {visible.length} of {result.requests.length} requests shown · Newest first
            </p>
            {visible.length === 0 ? (
              <p className="empty-state">No matching requests found</p>
            ) : (
              <div className="track-table-wrap" role="region" aria-label="Medicine requests table; scroll horizontally on small screens" tabIndex={0}>
                <table className="track-table">
                  <caption className="sr-only">Your medicine requests, newest first</caption>
                  <thead>
                    <tr>
                      {['Reference', 'Medicine', 'Category', 'Quantity', 'Date', 'Status', 'Action'].map(label => (
                        <th key={label} scope="col">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(request => (
                      <tr key={request.id}>
                        <th scope="row">{request.id}</th>
                        <td>{request.medicine}</td>
                        <td>{request.category}</td>
                        <td>{request.quantity}</td>
                        <td className="track-date">{request.date}</td>
                        <td>
                          <span className={`track-status track-status-${request.status.toLowerCase()}`}>{request.status}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button secondary small"
                            aria-label={`View Details for ${request.id}`}
                            aria-expanded={selectedId === request.id}
                            onClick={event => {
                              detailsTrigger.current = event.currentTarget;
                              setSelectedId(request.id);
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
