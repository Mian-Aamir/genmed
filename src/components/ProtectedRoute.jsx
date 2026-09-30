import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // SECURITY: This is only a UI-level guard. Real access control will be enforced by the backend.
  return user ? children : <Navigate to="/login" replace />;
}
