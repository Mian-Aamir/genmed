import { Link } from 'react-router-dom';
import '../styles/track.css';

export default function TrackRequests() {
  return (
    <section className="container dashboard-page">
      <h1>Module 2 coming soon</h1>
      <p>View and Track Medicine Requests will be implemented by the Module 2 owner.</p>
      <div className="dashboard-actions">
        <Link className="button" to="/request">Submit Request</Link>
        <Link className="button secondary" to="/patient">My dashboard</Link>
      </div>
    </section>
  );
}
