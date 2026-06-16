import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { isOnboardingDoneLocally, markOnboardingDoneLocally } from '@/lib/onboardingStorage';

export default function OnboardingGate({ children }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { data: preferences, isLoading: prefsLoading } = usePreferences();
  const location = useLocation();

  const localDone = user?.email ? isOnboardingDoneLocally(user.email) : false;
  const onboardingDone = !!(preferences?.onboardingCompletedAt || localDone);

  useEffect(() => {
    if (user?.email && preferences?.onboardingCompletedAt) {
      markOnboardingDoneLocally(user.email);
    }
  }, [user?.email, preferences?.onboardingCompletedAt]);

  if (authLoading || (isAuthenticated && prefsLoading)) {
    return <VeridianLoading fullPage />;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (location.pathname === '/onboarding') {
    return children;
  }

  if (location.pathname.startsWith('/library')) {
    return children;
  }

  if (!onboardingDone) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return children;
}
