import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivities } from '@/hooks/queries/useActivities';
import { useCardsByActivity } from '@/hooks/queries/useCards';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import DetailBackButton from '@/components/shared/DetailBackButton';
import InlineEditable from '@/components/deck-edit/InlineEditable';
import DeckAiPanel from '@/components/deck-edit/DeckAiPanel';
import { updateCard, createCard, deleteCard } from '@/api/entities/cards';
import { updateActivity } from '@/api/entities/activities';
import { generateCardId } from '@/utils/schemas/ids';
import { queryKeys } from '@/api/query-keys';

export default function EditDeckPage() {
  const { id: journeyId, moduleId, activityId } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: journey } = useJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const { data: activities = [] } = useActivities(moduleId);
  const { data: cards = [], isPending } = useCardsByActivity(activityId);
  const mod = modules.find((m) => m.moduleId === moduleId);
  const activity = activities.find((a) => a.activityId === activityId);

  const [aiOpen, setAiOpen] = useState(false);
  const [localCards, setLocalCards] = useState(null);

  const displayCards = localCards ?? cards;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
  };

  const saveField = async (cardId, field, value) => {
    setLocalCards((prev) => {
      const list = prev ?? cards;
      return list.map((c) => (c.cardId === cardId ? { ...c, [field]: value } : c));
    });
    await updateCard(cardId, { [field]: value });
    invalidate();
  };

  const handleApplyAiCards = async (aiCards) => {
    const existingIds = new Set(displayCards.map((c) => c.cardId));
    const updated = [...displayCards];

    for (const patch of aiCards) {
      if (patch.deleted && patch.cardId) {
        await deleteCard(patch.cardId);
        const idx = updated.findIndex((c) => c.cardId === patch.cardId);
        if (idx >= 0) updated.splice(idx, 1);
        continue;
      }

      if (patch.cardId && existingIds.has(patch.cardId)) {
        await updateCard(patch.cardId, {
          front: patch.front,
          back: patch.back,
          conceptTag: patch.conceptTag,
        });
        const idx = updated.findIndex((c) => c.cardId === patch.cardId);
        if (idx >= 0) updated[idx] = { ...updated[idx], ...patch };
      } else if (!patch.cardId && patch.front && patch.back) {
        const created = await createCard(activityId, journeyId, {
          cardId: generateCardId(),
          front: patch.front,
          back: patch.back,
          conceptTag: patch.conceptTag,
          fsrsState: {
            due: Date.now(),
            stability: 1,
            difficulty: 5,
            reps: 0,
            lapses: 0,
            state: 0,
            lastReview: null,
          },
        });
        updated.push(created);
      }
    }

    await updateActivity(activityId, {
      itemCount: updated.length,
      stats: { ...(activity?.stats ?? {}), dueCount: updated.length },
    });

    setLocalCards(updated);
    invalidate();
  };

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Edit Deck</h1>
        <LoginPrompt action="edit this flashcard deck" />
      </div>
    );
  }

  if (isPending && !displayCards.length) {
    return <VeridianLoading fullPage />;
  }

  if (!activity || activity.type !== 'flashcardSet') {
    return (
      <div className="edit-deck-page">
        <p className="journeys-error">Deck not found.</p>
      </div>
    );
  }

  return (
    <div className={`edit-deck-page${aiOpen ? ' edit-deck-page--ai-open' : ''}`}>
      <header className="edit-deck-header">
        <DetailBackButton to={`/journeys/${journeyId}/modules/${moduleId}`} label={mod?.name ?? 'Module'} />
        <div className="edit-deck-header-body">
          <h1 className="edit-deck-title">{activity.title ?? 'Flashcard deck'}</h1>
          <p className="edit-deck-meta">{displayCards.length} cards · click any text to edit</p>
        </div>
        <button type="button" className="btn btn-secondary edit-deck-ai-btn" onClick={() => setAiOpen(true)}>
          <Sparkles size={14} />
          Edit with AI
        </button>
      </header>

      <ul className="edit-deck-card-list">
        {displayCards.map((card, index) => (
          <li key={card.cardId ?? card.id} className="edit-deck-card">
            <span className="edit-deck-card-num">{index + 1}</span>
            <div className="edit-deck-card-sides">
              <div className="edit-deck-side">
                <span className="edit-deck-side-label">Front</span>
                <InlineEditable
                  value={card.front}
                  placeholder="Front text…"
                  onSave={(v) => saveField(card.cardId, 'front', v)}
                />
              </div>
              <div className="edit-deck-side">
                <span className="edit-deck-side-label">Back</span>
                <InlineEditable
                  value={card.back}
                  placeholder="Back text…"
                  multiline
                  onSave={(v) => saveField(card.cardId, 'back', v)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <DeckAiPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        cards={displayCards}
        moduleContext={{
          moduleName: mod?.name,
          concepts: mod?.knowledgeMap?.concepts ?? [],
          journeyTitle: journey?.title,
        }}
        onApplyCards={handleApplyAiCards}
      />
    </div>
  );
}
