import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/queries/useCurrentUser';

export default function RequireAdmin({ children }) {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="admin-gate-loading">
        <p>Checking access…</p>
      </div>
    );
  }

  if (!user?.email) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
}
