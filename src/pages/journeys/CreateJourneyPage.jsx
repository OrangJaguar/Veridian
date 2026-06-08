import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import StepBasicSetup from '@/components/journey-create/StepBasicSetup';
import StepSourceMaterial from '@/components/journey-create/StepSourceMaterial';
import StepProcessing from '@/components/journey-create/StepProcessing';
import StepReviewModules from '@/components/journey-create/StepReviewModules';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';

const STEPS = ['Setup', 'Material', 'Processing', 'Review'];

export default function CreateJourneyPage() {
  const { isAuthenticated } = useAuth();
  const step = useJourneyCreateStore((s) => s.step);
  const setStep = useJourneyCreateStore((s) => s.setStep);
  const resetWizard = useJourneyCreateStore((s) => s.resetWizard);

  useEffect(() => () => resetWizard(), [resetWizard]);

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
          onBuild={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepProcessing
          onSuccess={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <StepReviewModules onBack={() => setStep(2)} />
      )}

      {step > 4 && <Navigate to="/journeys/new" replace />}
    </div>
  );
}
