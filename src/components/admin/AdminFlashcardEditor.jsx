import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listCardsByActivity } from '@/api/entities/cards';
import { createCard, deleteCard } from '@/api/entities/cards';
import { generateCardId } from '@/utils/schemas/ids';

export default function AdminFlashcardEditor({ journeyId, activity }) {
  const qc = useQueryClient();
  const activityId = activity.activityId;

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', activityId],
    queryFn: () => listCardsByActivity(activityId),
  });

  const [draft, setDraft] = useState({ front: '', back: '' });

  const refresh = () => qc.invalidateQueries({ queryKey: ['cards', activityId] });

  const addCard = async () => {
    if (!draft.front.trim() || !draft.back.trim()) {
      toast.error('Front and back required');
      return;
    }
    await createCard(activityId, journeyId, {
      cardId: generateCardId(),
      front: draft.front.trim(),
      back: draft.back.trim(),
    });
    setDraft({ front: '', back: '' });
    refresh();
    toast.success('Card added');
  };

  const removeCard = async (cardId) => {
    await deleteCard(cardId);
    refresh();
  };

  if (isLoading) return <p className="journeys-status">Loading cards…</p>;

  return (
    <div className="admin-flashcard-editor">
      <div className="admin-card-form">
        <input className="settings-input" placeholder="Front" value={draft.front} onChange={(e) => setDraft({ ...draft, front: e.target.value })} />
        <input className="settings-input" placeholder="Back" value={draft.back} onChange={(e) => setDraft({ ...draft, back: e.target.value })} />
        <button type="button" className="btn btn-primary btn-sm" onClick={addCard}>Add card</button>
      </div>
      <ul className="admin-card-list">
        {cards.map((c) => (
          <li key={c.cardId} className="admin-card-row">
            <div><strong>{c.front}</strong><span>{c.back}</span></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeCard(c.cardId)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
