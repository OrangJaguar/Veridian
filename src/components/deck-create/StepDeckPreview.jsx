import { useDeckCreateStore } from '@/store/deckCreateStore';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function StepDeckPreview({ onBack, onNext }) {
  const draft = useDeckCreateStore((s) => s.draft);
  const updateDraft = useDeckCreateStore((s) => s.updateDraft);
  const isProcessing = useDeckCreateStore((s) => s.isProcessing);

  const canNext = draft.extractedPreview.trim().length >= 20;

  if (isProcessing && !draft.extractedPreview.trim()) {
    return (
      <div className="create-step create-step-processing">
        <VeridianLoading />
        <p className="create-step-desc">Extracting content from your PDF…</p>
      </div>
    );
  }

  return (
    <div className="create-step">
      <h2 className="create-step-title">Review extracted content</h2>
      {draft.extractedSummary && (
        <p className="create-step-desc">{draft.extractedSummary}</p>
      )}
      {!draft.extractedSummary && (
        <p className="create-step-desc">
          Trim or edit what we pulled from your PDF before generating cards.
        </p>
      )}

      <label className="create-field">
        <span>Cleaned source material</span>
        <textarea
          rows={16}
          value={draft.extractedPreview}
          onChange={(e) => updateDraft({ extractedPreview: e.target.value })}
        />
      </label>

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={isProcessing}>
          Back
        </button>
        <button type="button" className="btn btn-primary" disabled={!canNext || isProcessing} onClick={onNext}>
          Generate cards
        </button>
      </div>
    </div>
  );
}
