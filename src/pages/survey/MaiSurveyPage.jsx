import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import MaiSurveyWizard from '@/components/survey/MaiSurveyWizard';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { submitMaiSurvey } from '@/api/entities/maiSurvey';

export default function MaiSurveyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const instance = searchParams.get('instance') === 'day_60' ? 'day_60' : 'onboarding';
  const journeyId = searchParams.get('journeyId');
  const { data: preferences } = usePreferences();
  const [submitting, setSubmitting] = useState(false);

  const returnPath = instance === 'onboarding' && journeyId
    ? `/journeys/${journeyId}`
    : '/home';

  const handleSubmit = async (responses) => {
    setSubmitting(true);
    try {
      await submitMaiSurvey({
        surveyInstance: instance,
        responses,
        wasSkipped: false,
        preferences,
      });
      navigate(returnPath);
    } catch (err) {
      toast.error(err?.message || 'Could not save survey');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await submitMaiSurvey({
        surveyInstance: instance,
        responses: [],
        wasSkipped: true,
        preferences,
      });
      navigate(returnPath);
    } catch (err) {
      toast.error(err?.message || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mai-survey-page">
      <Link to={returnPath} className="journey-detail-back">← Back</Link>
      <MaiSurveyWizard
        title={instance === 'day_60' ? '60-day check-in' : 'Before you dive in'}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        submitting={submitting}
      />
    </div>
  );
}
