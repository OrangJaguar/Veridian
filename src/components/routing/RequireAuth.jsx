import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import VeridianLoading from '@/components/shared/VeridianLoading';

function isSafeRelativePath(path) {
  if (!path || !path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  return !/^\w+:\/\//.test(path.slice(1));
}

export default function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <VeridianLoading fullPage />;
  if (!user) {
    const rawPath = location.pathname + location.search;
    const safePath = isSafeRelativePath(rawPath) ? rawPath : '/';
    const redirect = encodeURIComponent(safePath);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return children;
}