import { useState } from 'react';
import { useDeckCreateStore } from '@/store/deckCreateStore';

export default function StepDeckDuplicates({ onBack, onFinish }) {
  const generatedCards = useDeckCreateStore((s) => s.generatedCards);
  const duplicateGroups = useDeckCreateStore((s) => s.duplicateGroups);
  const duplicateSelections = useDeckCreateStore((s) => s.duplicateSelections);
  const setDuplicateSelection = useDeckCreateStore((s) => s.setDuplicateSelection);
  const getResolvedCards = useDeckCreateStore((s) => s.getResolvedCards);
  const [saving, setSaving] = useState(false);

  const resolvedCount = getResolvedCards().length;

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onFinish();
    } finally {
      setSaving(false);
    }
  };

  if (!duplicateGroups.length) {
    return (
      <div className="create-step">
        <h2 className="create-step-title">Ready to save</h2>
        <p className="create-step-desc">
          {generatedCards.length} cards generated — no duplicates detected.
        </p>
        <div className="create-step-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack} disabled={saving}>Back</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleFinish}>
            {saving ? 'Saving…' : 'Create deck'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-step">
      <h2 className="create-step-title">Review duplicates</h2>
      <p className="create-step-desc">
        These cards test similar content. Pick the version to keep for each group.
        Final deck: {resolvedCount} cards.
      </p>

      <ul className="deck-dup-group-list">
        {duplicateGroups.map((group) => (
          <li key={group.id} className="deck-dup-group">
            <p className="deck-dup-reason">{group.reason}</p>
            <div className="deck-dup-options">
              {group.cardIndexes.map((idx) => {
                const card = generatedCards[idx];
                if (!card) return null;
                return (
                  <label key={idx} className="deck-dup-option">
                    <input
                      type="radio"
                      name={group.id}
                      checked={duplicateSelections[group.id] === idx}
                      onChange={() => setDuplicateSelection(group.id, idx)}
                    />
                    <div className="deck-dup-card-preview">
                      <strong>{card.front}</strong>
                      <span>{card.back}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="create-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleFinish}>
          {saving ? 'Saving…' : 'Create deck'}
        </button>
      </div>
    </div>
  );
}
