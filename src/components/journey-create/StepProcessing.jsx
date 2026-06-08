import { useJourneyCreateStore } from '@/store/journeyCreateStore';

export default function StepProcessing({ onBack, onRetry }) {
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const processingError = useJourneyCreateStore((s) => s.processingError);

  return (
    <div className="create-step create-processing">
      <h2 className="create-step-title">Building your Journey</h2>
      <p className="create-step-desc">
        Reading your material and building your Journey structure…
      </p>

      {isProcessing && !processingError && (
        <div className="create-spinner" aria-busy="true">
          <div className="create-spinner-ring" />
          <p>This may take 15–45 seconds.</p>
        </div>
      )}

      {processingError && (
        <div className="create-error-panel">
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
