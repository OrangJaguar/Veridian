import { toast } from 'sonner';

export default function FlashcardDeckList({ decks = [], cardsByActivity }) {
  return (
    <section className="module-flashcard-decks">
      <h3 className="module-panel-title">Flashcard Decks</h3>
      {decks.length === 0 ? (
        <p className="journeys-status">No flashcard decks yet. Create one when you&apos;re ready to practice.</p>
      ) : (
        <ul className="module-deck-list">
          {decks.map((deck) => {
            const cards = cardsByActivity[deck.activityId] ?? [];
            const due = deck.stats?.dueCount ?? 0;
            return (
              <li key={deck.activityId ?? deck.id} className="module-deck-item">
                <strong>{deck.title ?? 'Untitled Deck'}</strong>
                <span>{cards.length} cards · {due} due</span>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm module-add-deck"
        onClick={() => toast.info('Create flashcard deck in Phase 4/6')}
      >
        + Add Flashcard Deck
      </button>
    </section>
  );
}
