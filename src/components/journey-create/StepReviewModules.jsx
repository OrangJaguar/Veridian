import { useState } from 'react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { regenerateModules } from '@/api/ai/regenerateModules';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import { useConfirmJourney } from '@/hooks/mutations/useConfirmJourney';

export default function StepReviewModules({ onBack }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const proposal = useJourneyCreateStore((s) => s.proposal);
  const cachedKnowledgeMap = useJourneyCreateStore((s) => s.cachedKnowledgeMap);
  const updateModule = useJourneyCreateStore((s) => s.updateModule);
  const deleteModule = useJourneyCreateStore((s) => s.deleteModule);
  const addModule = useJourneyCreateStore((s) => s.addModule);
  const moveModule = useJourneyCreateStore((s) => s.moveModule);
  const beginProcessing = useJourneyCreateStore((s) => s.beginProcessing);
  const endProcessing = useJourneyCreateStore((s) => s.endProcessing);
  const setProposal = useJourneyCreateStore((s) => s.setProposal);
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);

  const confirmMutation = useConfirmJourney();
  const [regenerating, setRegenerating] = useState(false);

  if (!proposal) return null;

  const handleRegenerate = async () => {
    if (regenerating || isProcessing) return;
    const ok = window.confirm('Regenerate module structure using AI? This uses your cached concepts only.');
    if (!ok) return;

    const controller = beginProcessing();
    if (!controller) return;

    setRegenerating(true);
    try {
      const next = await regenerateModules({
        title: draft.title.trim(),
        subject: draft.subject.trim(),
        priorKnowledge: draft.priorKnowledge,
        cachedKnowledgeMap,
      }, { signal: controller.signal });
      setProposal(next);
      toast.success('Module structure regenerated');
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || 'Regenerate failed');
      }
    } finally {
      setRegenerating(false);
      endProcessing();
    }
  };

  const handleConfirm = () => {
    confirmMutation.mutate({
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      examDate: draft.examDate,
      priorKnowledge: draft.priorKnowledge,
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
              <p className="create-module-concepts">
                {mod.concepts.length} concept{mod.concepts.length === 1 ? '' : 's'}
                {' · '}
                <LatexRenderer text={mod.description} />
              </p>
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

      <div className="create-review-toolbar">
        <button type="button" className="btn btn-secondary btn-sm" onClick={addModule} disabled={proposal.modules.length >= 8}>
          + Add module
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleRegenerate}
          disabled={regenerating || isProcessing || confirmMutation.isPending}
        >
          {regenerating ? 'Regenerating…' : 'Regenerate structure'}
        </button>
      </div>

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={confirmMutation.isPending}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={confirmMutation.isPending || regenerating}
        >
          {confirmMutation.isPending ? 'Creating…' : 'Looks good, start studying'}
        </button>
      </div>
    </div>
  );
}
