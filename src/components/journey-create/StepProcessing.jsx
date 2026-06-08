import { useEffect, useRef } from 'react';
import { proposeJourney } from '@/api/ai/proposeJourney';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';

export default function StepProcessing({ onSuccess, onBack }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const processingError = useJourneyCreateStore((s) => s.processingError);
  const beginProcessing = useJourneyCreateStore((s) => s.beginProcessing);
  const endProcessing = useJourneyCreateStore((s) => s.endProcessing);
  const setProposal = useJourneyCreateStore((s) => s.setProposal);
  const started = useRef(false);

  const run = async () => {
    const controller = beginProcessing();
    if (!controller) return;

    try {
      const proposal = await proposeJourney({
        title: draft.title.trim(),
        subject: draft.subject.trim(),
        priorKnowledge: draft.priorKnowledge,
        material: draft.material,
      }, { signal: controller.signal });

      setProposal(proposal);
      endProcessing();
      onSuccess();
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'AI processing failed';
      endProcessing(msg);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    return () => {
      useJourneyCreateStore.getState().abortController?.abort();
    };
  }, []);

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
            <button type="button" className="btn btn-primary" onClick={() => { started.current = false; run(); }}>
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
