import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../data/demoUsers';

export default function Dashboard() {
  const { user } = useAuth();
  return <Navigate to={dashboardPath(user?.role)} replace />;
}
