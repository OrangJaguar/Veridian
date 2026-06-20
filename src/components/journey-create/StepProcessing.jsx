import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';

export default function StepProcessing({ onBack, onRetry }) {
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const processingError = useJourneyCreateStore((s) => s.processingError);

  return (
    <div className="create-step create-processing">
      {isProcessing && !processingError && (
        <AiGenerationLoading
          action="proposeJourney"
          fullPage={false}
          className="create-step-ai-loading"
        />
      )}

      {processingError && (
        <div className="create-error-panel">
          <h2 className="create-step-title">Building your Journey</h2>
          <p className="create-error">{processingError}</p>
          <div className="create-step-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Try pasting text instead
            </button>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
