import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../data/demoUsers';
import Icon from '../components/Icon';

export default function AccessDenied() {
  const { user } = useAuth();
  return <section className="container empty-state not-found" role="alert">
    <Icon name="shield" size={40} />
    <h1>Access Denied</h1>
    <p>Your account does not have permission to use this workspace.</p>
    <Link className="button" to={dashboardPath(user?.role)}>Return to my dashboard</Link>
  </section>;
}
