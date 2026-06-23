import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { dismissHomeWelcomeHint } from '@/utils/preferences/dismissHomeWelcomeHint';
import { HINT_HOME_WELCOME, hasHintShown } from '@/utils/preferences/hintsShown';

export default function HomeWelcomeBanner({ journeyCount = 0 }) {
  const { data: preferences } = usePreferences();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissedLocally, setDismissedLocally] = useState(false);

  const dismiss = useCallback(async () => {
    setDismissedLocally(true);
    try {
      await dismissHomeWelcomeHint(queryClient, user?.email);
    } catch {
      // Banner stays hidden — dismiss intent is clear
    }
  }, [queryClient, user?.email]);

  if (!preferences?.onboardingCompletedAt) return null;
  if (dismissedLocally || hasHintShown(preferences, HINT_HOME_WELCOME)) return null;
  if (journeyCount > 0) return null;

  return (
    <div className="home-welcome-banner" role="region" aria-label="Welcome">
      <div className="home-welcome-banner-copy">
        <h2 className="home-welcome-banner-title">Welcome to Veridian — let&apos;s get you started</h2>
        <p className="home-welcome-banner-text">
          Veridian helps you study smarter with spaced repetition and AI-generated study materials
          tailored to your subjects and goals.
        </p>
        <Link
          to="/journeys/new"
          className="btn btn-primary home-welcome-banner-cta"
          onClick={dismiss}
        >
          Create Your First Journey
        </Link>
      </div>
      <button
        type="button"
        className="home-welcome-banner-dismiss"
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
