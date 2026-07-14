import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLandingChrome } from '@/contexts/LandingChromeContext';
import { getBaselineCompleted, getBaselineOutcome, getBaselineUnlocked } from '@/lib/baselineStorage';
import { trackProductEvent } from '@/lib/analytics';

export default function SiteHeader({ actions, variant = 'default' }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  useLandingChrome();
  const isLanding = variant === 'landing' || location.pathname === '/';
  const baselineUnlocked = getBaselineUnlocked();
  const baselineOutcome = getBaselineOutcome();
  const showPrimaryCta = isLanding && baselineUnlocked;

  const landingActions = !isLoading && (
    user ? (
      <Link
        to="/home"
        className="btn btn-primary site-header-signup-compact"
      >
        Go to App
      </Link>
    ) : (
      <>
        {showPrimaryCta && (
          <Link
            to={getBaselineCompleted() ? '/signup' : '/signin'}
            className="btn btn-primary site-header-signup-compact"
            onClick={() => trackProductEvent('signup_click', { source: 'header', outcome: baselineOutcome })}
          >
            {getBaselineCompleted() ? 'Sign Up' : 'Get Started'}
          </Link>
        )}
        <Link to="/signin" className="site-header-text-link">
          Sign In
        </Link>
      </>
    )
  );

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
        {actions ?? (isLanding ? landingActions : defaultActions)}
      </div>
    </header>
  );
}
