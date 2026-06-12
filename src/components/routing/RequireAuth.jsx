import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <VeridianLoading fullPage />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return children;
}
