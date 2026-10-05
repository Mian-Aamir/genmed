import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccessDenied from '../pages/AccessDenied';

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  // SECURITY: This is only a UI-level guard. Real access control will be enforced by the backend.
  if (!user) return <Navigate to="/login" replace />;
  // SECURITY: Fail closed for unknown roles and check every protected route, including direct URLs.
  if (!['patient', 'doctor'].includes(user.role) || (role && user.role !== role)) return <AccessDenied />;
  return children;
}
