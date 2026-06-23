import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackProductEventOnce } from '@/lib/analytics';

const PATH_EVENTS = {
  '/': 'landing_view',
  '/library': 'library_view',
  '/signup': 'signup_start',
};

export default function ProductAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const event = PATH_EVENTS[location.pathname];
    if (event) {
      trackProductEventOnce(event);
    }
    if (location.pathname.startsWith('/library/') && location.pathname !== '/library') {
      trackProductEventOnce('library_preview');
    }
  }, [location.pathname]);

  return null;
}
