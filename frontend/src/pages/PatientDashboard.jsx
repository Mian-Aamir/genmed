import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { medicines } from '../data/medicines';
import ReviewSummary from '../components/ReviewSummary';
import Icon from '../components/Icon';

export default function PatientDashboard() {
  const { user, requests, requestReview, loadReviews } = useAuth();
  // Activity 6: always show the latest statuses from GET /api/reviews when the page opens.
  useEffect(() => { loadReviews(); }, [loadReviews]);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const medicineId = Number(new FormData(form).get('medicineId'));
    // Activity 6: POST /api/reviews. The server sets the owner from the JWT.
    const result = await requestReview(medicineId);
    setMessage(result);
    if (result.ok) form.reset();
  }

  return (
    <section className="container dashboard-page">
      <span className="eyebrow">PATIENT WORKSPACE</span>
      <h1>Welcome, {user.name}</h1>
      <p className="dashboard-intro">Explore options, request a demo review, and follow your requests in one place.</p>
      <div className="dashboard-actions">
        <Link className="button" to="/search">
          <Icon name="search" size={18} />
          Find medicine
        </Link>
        <a className="button secondary" href="#new-request">Request a review</a>
        <a className="button secondary" href="#my-requests">Track my requests ({requests.length})</a>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel" id="new-request" aria-labelledby="request-title">
          <h2 id="request-title">Request a medicine review</h2>
          <p>Choose a sample medicine for the classroom review workflow. No prescription or personal medical history is needed.</p>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="requested-medicine">Sample medicine</label>
              <select id="requested-medicine" name="medicineId" defaultValue="" required>
                <option value="" disabled>Choose a medicine</option>
                {medicines.map(medicine => (
                  <option key={medicine.id} value={medicine.id}>{medicine.brand} — {medicine.strength}</option>
                ))}
              </select>
            </div>
            <button className="button" type="submit">Submit review request</button>
            <p role="status" className={message?.ok ? 'success-message' : 'field-error'}>{message?.message}</p>
          </form>
        </section>
        <aside className="dashboard-panel privacy-panel">
          <Icon name="shield" size={32} />
          <h2>Your information, limited by role.</h2>
          <p>You can see only your own requests. Doctor contact views show masked email addresses, and internal review notes are omitted from your view.</p>
          <p className="fine-print">All records are fictional. Access rules are enforced by the GenMed server; this is still a classroom system, not a confidential medical record.</p>
        </aside>
      </div>
      <section id="my-requests" className="request-section" aria-labelledby="my-requests-title">
        <h2 id="my-requests-title">My review requests</h2>
        <p>Requests are saved on the GenMed server. Status updates appear here after the Doctor account reviews them.</p>
        {requests.length ? (
          <div className="review-grid">
            {requests.map(request => (
              <article className="dashboard-panel" key={request.id}>
                <ReviewSummary request={request} />
                <p className="fine-print">
                  {request.status === 'pending'
                    ? 'Awaiting a demo review.'
                    : 'Demo workflow completed. Consult a real doctor or pharmacist before making any treatment change.'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No requests yet. Choose a sample medicine to get started.</p>
        )}
      </section>
      <section className="request-section" aria-labelledby="medicine-request-modules">
        <h2 id="medicine-request-modules">Medicine request modules</h2>
        <div className="dashboard-grid">
          <article className="dashboard-panel">
            <h3>Submit Medicine Request</h3>
            <p>Submit a demo medicine request and see its reference in My Requests.</p>
            <Link className="button" to="/request">Submit Request</Link>
          </article>
          <article className="dashboard-panel">
            <h3>View and Track Medicine Requests</h3>
            <p>Search your requests by reference and follow their status.</p>
            <Link className="button secondary" to="/track">Track Requests</Link>
          </article>
        </div>
      </section>
      <aside className="safety-note">
        <Icon name="shield" />
        <p>Always confirm with your doctor or pharmacist before switching medicines. Prices are approximate. Demo review decisions are not medical advice or approval.</p>
      </aside>
    </section>
  );
}
