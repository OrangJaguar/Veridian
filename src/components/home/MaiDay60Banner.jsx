import { Link } from 'react-router-dom';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { dismissMaiDay60Survey } from '@/api/entities/maiSurvey';
import { useQueryClient } from '@tanstack/react-query';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function MaiDay60Banner() {
  const { data: preferences } = usePreferences();
  const queryClient = useQueryClient();

  if (!preferences?.createdAt) return null;
  if (preferences.maiSurveyDay60CompletedAt || preferences.maiSurveyDay60DismissedAt) {
    return null;
  }
  if (!preferences.maiSurveyOnboardingCompletedAt) return null;

  const accountAgeDays = Math.floor((Date.now() - preferences.createdAt) / MS_PER_DAY);
  if (accountAgeDays < 60) return null;

  const handleDismiss = async () => {
    await dismissMaiDay60Survey();
    queryClient.invalidateQueries({ queryKey: ['preferences'] });
  };

  return (
    <div className="mai-day60-banner home-welcome-banner" role="region" aria-label="60-day survey">
      <div className="mai-day60-banner-content">
        <p className="mai-day60-banner-text">
          You&apos;ve been with Veridian for 60 days — take a quick 5-question check-in on how you study.
        </p>
        <div className="mai-day60-banner-actions">
          <Link to="/mai-survey?instance=day_60" className="btn btn-primary btn-sm">
            Take survey
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
