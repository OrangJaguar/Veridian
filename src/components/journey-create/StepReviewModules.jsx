import LatexRenderer from '@/components/shared/LatexRenderer';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import { useConfirmJourney } from '@/hooks/mutations/useConfirmJourney';

export default function StepReviewModules({ onBack }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const proposal = useJourneyCreateStore((s) => s.proposal);
  const updateModule = useJourneyCreateStore((s) => s.updateModule);
  const deleteModule = useJourneyCreateStore((s) => s.deleteModule);
  const moveModule = useJourneyCreateStore((s) => s.moveModule);
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);

  const confirmMutation = useConfirmJourney();

  if (!proposal) return null;

  const handleConfirm = () => {
    confirmMutation.mutate({
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      examDate: draft.examDate,
      priorKnowledge: draft.priorKnowledge,
      isPublic: draft.isPublic,
      tags: draft.tags,
      proposal,
    });
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Review modules</h2>
      <p className="create-step-desc">{proposal.journeySummary}</p>

      <label className="create-field">
        <span>Journey title</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => {
            useJourneyCreateStore.getState().updateDraft({ title: e.target.value });
          }}
        />
      </label>

      <ul className="create-module-list">
        {proposal.modules.map((mod, index) => (
          <li key={`${mod.name}-${index}`} className="create-module-item">
            <div className="create-module-editor">
              <input
                type="text"
                className="create-module-name"
                value={mod.name}
                onChange={(e) => updateModule(index, { name: e.target.value })}
              />
              <input
                type="text"
                className="create-module-desc"
                value={mod.description}
                onChange={(e) => updateModule(index, { description: e.target.value })}
              />
              <div className="create-module-concepts">
                <p className="create-module-concepts-label">
                  {mod.concepts.length} concept{mod.concepts.length === 1 ? '' : 's'}
                </p>
                <ul className="create-module-concept-list">
                  {mod.concepts.map((concept) => (
                    <li key={concept.id ?? concept.term}>
                      <strong>{concept.term}</strong>
                      {concept.definition && (
                        <>
                          {' — '}
                          <LatexRenderer text={concept.definition} />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="create-module-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveModule(index, -1)} disabled={index === 0}>
                ↑
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveModule(index, 1)} disabled={index === proposal.modules.length - 1}>
                ↓
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => deleteModule(index)} disabled={proposal.modules.length <= 2}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={confirmMutation.isPending}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={confirmMutation.isPending || isProcessing}
        >
          {confirmMutation.isPending ? 'Creating…' : 'Looks good — continue'}
        </button>
      </div>
    </div>
  );
}
