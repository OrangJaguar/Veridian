import VeridianLoading from '@/components/shared/VeridianLoading';
import { useDeckCreateStore } from '@/store/deckCreateStore';

export default function StepDeckProcessing({ onRetry, onBack }) {
  const processingError = useDeckCreateStore((s) => s.processingError);
  const isProcessing = useDeckCreateStore((s) => s.isProcessing);

  if (processingError) {
    return (
      <div className="create-step create-step-processing">
        <h2 className="create-step-title">Generation failed</h2>
        <p className="create-error">{processingError}</p>
        <div className="create-step-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
          <button type="button" className="btn btn-primary" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-step create-step-processing">
      <VeridianLoading />
      <h2 className="create-step-title">{isProcessing ? 'Generating your deck…' : 'Saving your deck…'}</h2>
      <p className="create-step-desc">AI is building cards from your content. This usually takes under a minute.</p>
    </div>
  );
}
