import { DECK_PURPOSES, DECK_SOURCE_MODES } from '@/api/ai/prompts/flashcards';
import { ChoiceRadio } from '@/components/shared/ChoiceControl';
import { useDeckCreateStore } from '@/store/deckCreateStore';

export default function StepDeckSetup({ onNext, onAutoGenerate }) {
  const draft = useDeckCreateStore((s) => s.draft);
  const updateDraft = useDeckCreateStore((s) => s.updateDraft);
  const isProcessing = useDeckCreateStore((s) => s.isProcessing);

  const canNext = draft.title.trim().length >= 2 && draft.cardCount >= 5;
  const isAuto = draft.sourceMode === 'moduleAuto';

  const handleNext = () => {
    if (isAuto) {
      onAutoGenerate?.();
      return;
    }
    onNext();
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Deck setup</h2>
      <p className="create-step-desc">
        Name your deck, choose how cards are built, and set how many to generate.
      </p>

      <label className="create-field">
        <span>Deck name</span>
        <input
          type="text"
          value={draft.title}
          placeholder="e.g. Unit 4 key terms"
          onChange={(e) => updateDraft({ title: e.target.value })}
        />
      </label>

      <div className="study-setup-section">
        <span className="study-setup-label">How should we build your cards?</span>
        <div className="deck-source-mode-list">
          {DECK_SOURCE_MODES.map((mode) => (
            <div key={mode.id} className="deck-source-mode-option">
              <ChoiceRadio
                name="deckSourceMode"
                value={mode.id}
                label={mode.label}
                checked={draft.sourceMode === mode.id}
                onChange={(value) => updateDraft({
                  sourceMode: value,
                  rawContent: '',
                  parsedPairs: [],
                  extractedPreview: '',
                })}
              />
              <p className="deck-purpose-desc">{mode.description}</p>
            </div>
          ))}
        </div>
      </div>

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
        <span className="create-field-hint">
          {isAuto
            ? '5–80 cards drawn from module concepts and journey context.'
            : '5–80 cards. AI prioritizes your content first.'}
        </span>
      </label>

      <div className="create-step-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canNext || isProcessing}
          onClick={handleNext}
        >
          {isAuto ? 'Generate deck' : 'Next'}
        </button>
      </div>
    </div>
  );
}
