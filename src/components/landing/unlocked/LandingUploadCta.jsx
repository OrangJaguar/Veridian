import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { trackProductEvent } from '@/lib/analytics';
import { getBaselineCompleted } from '@/lib/baselineStorage';

export default function LandingUploadCta({ variant = 'primary', source = 'landing', className = '' }) {
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    trackProductEvent('upload_cta_click', { source, authenticated: isAuthenticated });
  };

  if (isAuthenticated) {
    return (
      <Link
        to="/journeys/new"
        className={`landing-upload-cta landing-upload-cta--${variant} ${className}`.trim()}
        onClick={handleClick}
      >
        Upload a topic — we&apos;ll run this same kind of test on your material
      </Link>
    );
  }

  const href = getBaselineCompleted() ? '/signup' : '/signin';

  return (
    <Link
      to={href}
      className={`landing-upload-cta landing-upload-cta--${variant} ${className}`.trim()}
      onClick={handleClick}
    >
      Upload a topic — we&apos;ll run this same kind of test on your material
    </Link>
  );
}
