import { useState } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import FlashcardReview from '@/components/study/flashcard/FlashcardReview';
import SessionSummary from '@/components/study/SessionSummary';
import { getDueCards } from '@/utils/fsrs';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateCard } from '@/hooks/mutations/useCardMutations';

export default function FlashcardSession({ session, activity, module, journeyId, cards = [] }) {
  const [phase, setPhase] = useState(session.sessionData?.mode ? 'active' : 'pick');
  const [mode, setMode] = useState(session.sessionData?.mode ?? 'due');
  const [reviewCards, setReviewCards] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateCard = useUpdateCard();

  const dueCards = getDueCards(cards);
  const activeCards = mode === 'due' ? dueCards : cards.filter((c) => !c.suspended);

  const startMode = (selectedMode) => {
    setMode(selectedMode);
    setReviewCards(selectedMode === 'due' ? dueCards : cards.filter((c) => !c.suspended));
    setPhase('active');
  };

  const handleRate = async (card, newState) => {
    await updateCard.mutateAsync({
      cardId: card.cardId,
      journeyId,
      activityId: activity.activityId,
      patch: { fsrsState: newState },
    });
  };

  const handleComplete = async (reviews, counts) => {
    setSummaryStats(counts);
    const sessionData = { mode, reviews, counts };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: null,
      outcomeSummary: {
        itemsCompleted: reviews.length,
        nextAction: counts.again > 0 ? 'Cards marked Again will return soon' : 'Great review session',
      },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  const returnPath = module?.moduleId
    ? `/journeys/${journeyId}/modules/${module.moduleId}`
    : `/journeys/${journeyId}`;

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Flashcard review complete"
        stats={[
          { label: 'Reviewed', value: summaryStats ? Object.values(summaryStats).reduce((a, b) => a + b, 0) : 0 },
          { label: 'Again', value: summaryStats?.again ?? 0 },
        ]}
        returnHref={returnPath}
      />
    );
  }

  return (
    <StudyChrome
      title={activity.title ?? 'Flashcards'}
      progressText={phase === 'pick' ? 'Choose mode' : `${mode === 'due' ? 'Due' : 'Browse'} review`}
      onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}
    >
      {phase === 'pick' && (
        <div className="study-flashcard-pick">
          <button type="button" className="btn btn-primary" disabled={dueCards.length === 0} onClick={() => startMode('due')}>
            Review Due Cards ({dueCards.length})
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => startMode('browse')}>
            Browse All Cards ({cards.length})
          </button>
        </div>
      )}
      {phase === 'active' && (
        <FlashcardReview cards={reviewCards.length ? reviewCards : activeCards} onRate={handleRate} onComplete={handleComplete} />
      )}
    </StudyChrome>
  );
}
