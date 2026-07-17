import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Download, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import { toast } from 'sonner';
import { exportToTsv, exportToCsv } from '@/utils/export/exportFlashcards';

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
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const displayCards = localCards ?? cards;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
  };

  const saveField = async (cardId, field, value) => {
    const snapshot = localCards ?? cards;
    setLocalCards((prev) => {
      const list = prev ?? cards;
      return list.map((c) => (c.cardId === cardId ? { ...c, [field]: value } : c));
    });
    try {
      await updateCard(cardId, { [field]: value });
      invalidate();
    } catch {
      setLocalCards(snapshot);
      toast.error("Changes couldn't be saved");
    }
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
        <div className="edit-deck-header-actions">
          <div className="export-dropdown" ref={exportRef}>
            <button
              type="button"
              className="btn btn-secondary export-dropdown-trigger"
              onClick={() => setExportOpen((p) => !p)}
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div className="export-dropdown-menu">
                <button
                  type="button"
                  className="export-dropdown-item"
                  onClick={() => { exportToTsv(displayCards, activity.title); setExportOpen(false); }}
                >
                  TSV (Quizlet / Anki)
                </button>
                <button
                  type="button"
                  className="export-dropdown-item"
                  onClick={() => { exportToCsv(displayCards, activity.title); setExportOpen(false); }}
                >
                  CSV
                </button>
              </div>
            )}
          </div>
          <button type="button" className="btn btn-secondary edit-deck-ai-btn" onClick={() => setAiOpen(true)}>
            <Sparkles size={14} />
            Edit with AI
          </button>
        </div>
      </header>

      <ul className="edit-deck-card-list">
        {displayCards.map((card, idx) => {
          const fsrs = card.fsrsState;
          const dueMs = fsrs?.due;
          const isNew = !fsrs || fsrs.reps === 0;
          const isDue = dueMs && dueMs <= Date.now();
          const healthLabel = isNew ? 'New' : isDue ? 'Due' : 'Good';
          const healthClass = isNew ? 'card-health--new' : isDue ? 'card-health--due' : 'card-health--good';

          return (
            <li key={card.cardId ?? card.id} className="edit-deck-card">
              <span className="edit-deck-card-num">{idx + 1}</span>
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
              <span
                className={`card-health-badge ${healthClass}`}
                title={dueMs ? `Due ${formatDistanceToNow(new Date(dueMs), { addSuffix: true })}` : 'Not yet reviewed'}
              >
                {healthLabel}
              </span>
            </li>
          );
        })}
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
