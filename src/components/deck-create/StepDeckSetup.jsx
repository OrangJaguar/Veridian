import { DECK_PURPOSES } from '@/api/ai/prompts/flashcards';
import { ChoiceRadio } from '@/components/shared/ChoiceControl';
import { useDeckCreateStore } from '@/store/deckCreateStore';

export default function StepDeckSetup({ onNext }) {
  const draft = useDeckCreateStore((s) => s.draft);
  const updateDraft = useDeckCreateStore((s) => s.updateDraft);

  const canNext = draft.title.trim().length >= 2 && draft.cardCount >= 5;

  return (
    <div className="create-step">
      <h2 className="create-step-title">Deck setup</h2>
      <p className="create-step-desc">Name your deck, choose its purpose, and set how many cards to generate.</p>

      <label className="create-field">
        <span>Deck name</span>
        <input
          type="text"
          value={draft.title}
          placeholder="e.g. Unit 4 key terms"
          onChange={(e) => updateDraft({ title: e.target.value })}
        />
      </label>

      <fieldset className="create-field create-fieldset">
        <legend className="create-fieldset-legend">Deck purpose</legend>
        <div className="create-choice-list deck-purpose-list">
          {DECK_PURPOSES.map((opt) => (
            <div key={opt.value} className="deck-purpose-option">
              <ChoiceRadio
                name="deckPurpose"
                value={opt.value}
                label={opt.label}
                checked={draft.purpose === opt.value}
                onChange={(value) => updateDraft({ purpose: value })}
              />
              <p className="deck-purpose-desc">{opt.description}</p>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="create-field">
        <span>Number of cards ({draft.cardCount})</span>
        <input
          type="range"
          min={5}
          max={80}
          step={1}
          value={draft.cardCount}
          onChange={(e) => updateDraft({ cardCount: Number(e.target.value) })}
        />
        <span className="create-field-hint">5–80 cards. AI prioritizes your content first.</span>
      </label>

      <div className="create-step-actions">
        <button type="button" className="btn btn-primary" disabled={!canNext} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
