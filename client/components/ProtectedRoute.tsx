import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

// Redirects unauthenticated users to /auth/signin with a reason + return path,
// instead of the page silently rendering blank/stuck (e.g. AdminDashboard's
// old infinite "Carregando..." spinner for logged-out visitors).
export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate to={`/auth/signin?reason=unauthenticated&redirect=${redirect}`} replace />
    );
  }

  if (adminOnly && user.tipoUsuario !== "adm") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
