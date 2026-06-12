import { useState } from 'react';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import CreateDeckModal from '@/components/study/flashcard/CreateDeckModal';

export default function FlashcardDeckList({ decks = [], cardsByActivity, moduleId, journeyId, knowledgeMap }) {
  const [modalOpen, setModalOpen] = useState(false);
  const launchStudy = useLaunchStudy();

  const handleLaunch = (deck) => {
    launchStudy({
      journeyId,
      activity: deck,
      moduleId,
    });
  };

  return (
    <section className="module-flashcard-decks">
      <h3 className="module-panel-title">Flashcard Decks</h3>
      {decks.length === 0 ? (
        <p className="journeys-status">No flashcard decks yet. Create one when you&apos;re ready to practice.</p>
      ) : (
        <ul className="module-deck-card-list">
          {decks.map((deck) => {
            const cards = cardsByActivity[deck.activityId] ?? [];
            const due = deck.stats?.dueCount ?? 0;
            return (
              <li key={deck.activityId ?? deck.id} className="module-deck-card">
                <div className="module-deck-card-main">
                  <span className="module-deck-card-name">{deck.title ?? 'Untitled Deck'}</span>
                  <span className="module-deck-card-meta">
                    {cards.length} cards · {due} due
                  </span>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleLaunch(deck)}>
                  Review
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm module-add-deck"
        onClick={() => setModalOpen(true)}
      >
        + Add Flashcard Deck
      </button>
      <CreateDeckModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        moduleId={moduleId}
        journeyId={journeyId}
        knowledgeMap={knowledgeMap}
      />
    </section>
  );
}
