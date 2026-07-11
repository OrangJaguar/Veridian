import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { updatePreferences } from '@/api/entities/preferences';
import { startAsyncJourneyGeneration } from '@/api/entities/startAsyncJourneyGeneration';
import { queryKeys } from '@/api/query-keys';
import { useIsNewCreateUser } from '@/utils/user/isNewUser';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import CreateJourneyWelcomeModal from '@/components/journey-create/CreateJourneyWelcomeModal';
import StepBasicSetup from '@/components/journey-create/StepBasicSetup';
import StepSourceMaterial from '@/components/journey-create/StepSourceMaterial';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import { toast } from 'sonner';
import { trackProductEvent } from '@/lib/analytics';

const STEPS = ['Setup', 'Material'];

export default function CreateJourneyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { data: preferences } = usePreferences();
  const { data: journeys = [] } = useJourneys({ archived: false });
  const step = useJourneyCreateStore((s) => s.step);
  const setStep = useJourneyCreateStore((s) => s.setStep);
  const resetWizard = useJourneyCreateStore((s) => s.resetWizard);
  const draft = useJourneyCreateStore((s) => s.draft);
  const updateDraft = useJourneyCreateStore((s) => s.updateDraft);
  const showWelcome = useIsNewCreateUser(journeys, preferences);

  useEffect(() => () => resetWizard(), [resetWizard]);

  useEffect(() => {
    if (preferences?.defaultPrivacy === 'public') {
      updateDraft({ isPublic: true });
    }
  }, [preferences?.defaultPrivacy, updateDraft]);

  const dismissWelcome = async (goHome) => {
    await updatePreferences({ hasSeenCreateWelcome: true });
    queryClient.invalidateQueries({ queryKey: queryKeys.preferences(user?.email) });
    if (goHome) navigate('/home', { replace: true });
  };

  const handleGenerate = async () => {
    try {
      trackProductEvent('journey_create_start');
      const { journeyId } = await startAsyncJourneyGeneration(draft);
      trackProductEvent('journey_create_complete', { journeyId });
      resetWizard();
      navigate(`/journeys/${journeyId}`, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Could not start journey generation.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Create Journey</h1>
        <LoginPrompt action="create a Journey from your study material" />
      </div>
    );
  }

  return (
    <div className="create-journey-page">
      <CreateJourneyWelcomeModal
        open={showWelcome}
        onBuild={() => dismissWelcome(false)}
        onSkip={() => dismissWelcome(true)}
      />

      <Link to="/journeys" className="journey-detail-back">← Journeys</Link>

      <header className="create-journey-header">
        <h1 className="create-journey-title">Create Journey</h1>
        <ol className="create-stepper">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`create-stepper-item${step === i + 1 ? ' active' : ''}${step > i + 1 ? ' done' : ''}`}
            >
              {label}
            </li>
          ))}
        </ol>
      </header>

      {step === 1 && (
        <StepBasicSetup onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <StepSourceMaterial
          onBack={() => setStep(1)}
          onBuild={handleGenerate}
        />
      )}

      {step > 2 && <Navigate to="/journeys/new" replace />}
    </div>
  );
}
