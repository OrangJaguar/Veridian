import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function SiteHeader({ actions }) {
  const { user, isLoading } = useAuth();

  const defaultActions = !isLoading && (
    user ? (
      <Link to="/home" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
        Go to App
      </Link>
    ) : (
      <>
        <Link to="/signin" className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
          Sign in
        </Link>
        <Link to="/signup" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
          Get Started
        </Link>
      </>
    )
  );

  return (
    <header className="site-header">
      <Link to="/" className="site-wordmark">
        Veridian
      </Link>
      <div className="site-header-actions">
        {actions ?? defaultActions}
      </div>
    </header>
  );
}
