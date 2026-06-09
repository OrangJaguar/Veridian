import { useState } from 'react';
import { toast } from 'sonner';
// import { generateFlashcards } from '@/api/ai/study';
import { createFlashcardDeck } from '@/api/entities/journeyScaffold';

export default function CreateDeckModal({ open, onClose, moduleId, journeyId, onCreated }) {
  const [title, setTitle] = useState('');
  const [cards, setCards] = useState([{ front: '', back: '' }]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const deckCards = cards.filter((c) => c.front.trim() && c.back.trim());
      if (deckCards.length === 0) {
        toast.error('Add at least one card with front and back.');
        return;
      }
      // AI generation (disabled until geminiStudy is deployed):
      // if (mode === 'ai') {
      //   const result = await generateFlashcards({ knowledgeMap, deckName: title, maxCards: 20 });
      //   deckCards = result.data?.cards ?? [];
      // }
      const activity = await createFlashcardDeck(moduleId, journeyId, {
        title: title.trim(),
        cards: deckCards.map((c) => ({
          cardId: c.cardId ?? `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          front: c.front,
          back: c.back,
          conceptTag: c.conceptTag,
        })),
      });
      onCreated?.(activity);
      onClose();
      toast.success('Deck created');
    } catch (err) {
      toast.error(err.message || 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => setCards([...cards, { front: '', back: '' }]);

  return (
    <div className="study-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="study-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Create flashcard deck</h2>
        <label className="study-setup-field">
          Deck name
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Key terms" />
        </label>
        {cards.map((c, i) => (
          <div key={i} className="study-deck-row">
            <input placeholder="Front" value={c.front} onChange={(e) => {
              const next = [...cards];
              next[i] = { ...next[i], front: e.target.value };
              setCards(next);
            }} />
            <input placeholder="Back" value={c.back} onChange={(e) => {
              const next = [...cards];
              next[i] = { ...next[i], back: e.target.value };
              setCards(next);
            }} />
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>+ Add card</button>
        <div className="study-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={handleCreate}>
            {loading ? 'Creating…' : 'Create deck'}
          </button>
        </div>
      </div>
    </div>
  );
}
