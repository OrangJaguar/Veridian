import { useState, useMemo, useRef } from 'react';
import FlashcardReview from '@/components/study/flashcard/FlashcardReview';
import FlashcardTypingDrill from '@/components/study/flashcard/FlashcardTypingDrill';
import FlashcardSummary from '@/components/study/flashcard/FlashcardSummary';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateCard } from '@/hooks/mutations/useCardMutations';
import { getDueCards } from '@/utils/fsrs';

function initialPhase(session) {
  if (session.status === 'completed' && session.sessionData?.reviews?.length) return 'summary';
  return 'review';
}

function resolveFlashcardMode(session) {
  return session.sessionData?.flashcardMode
    ?? session.sessionData?.prescription?.spec?.flashcardMode
    ?? 'browse';
}

export default function FlashcardSession({ session, activity, module, journeyId, cards = [] }) {
  const [phase, setPhase] = useState(() => initialPhase(session));
  const [totalTimeSec, setTotalTimeSec] = useState(session.durationSec ?? 0);
  const pendingUpdates = useRef([]);
  const masteryStatsRef = useRef(session.sessionData?.masteryStats ?? {});
  const sessionStartRef = useRef(Date.now());
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateCard = useUpdateCard();

  const flashcardMode = resolveFlashcardMode(session);
  const mixedPhrasing = session.sessionData?.mixedPhrasing
    ?? session.sessionData?.prescription?.spec?.mixedPhrasing
    ?? false;

  const reviewCards = useMemo(() => {
    const active = cards.filter((c) => !c.suspended);
    if (flashcardMode === 'due') {
      const due = getDueCards(active);
      return due.length ? due : active;
    }
    return active;
  }, [cards, flashcardMode]);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath: '/home' });
  };

  const handleRate = (card, newState) => {
    updateCard.mutate({
      cardId: card.cardId,
      journeyId,
      activityId: activity.activityId,
      patch: { fsrsState: newState },
    });
  };

  const handleReviewComplete = (reviews) => {
    pendingUpdates.current = reviews;
    setPhase('typing');
  };

  const handleTypingComplete = (typingResults) => {
    const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    setTotalTimeSec(elapsed);

    const sessionData = {
      mode: flashcardMode === 'due' ? 'due' : 'browse',
      flashcardMode,
      mixedPhrasing,
      reviews: pendingUpdates.current,
      typingResults,
      masteryStats: masteryStatsRef.current,
      prescription: session.sessionData?.prescription ?? null,
    };

    setPhase('summary');

    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: null,
      outcomeSummary: {
        itemsCompleted: pendingUpdates.current.length + typingResults.length,
        nextAction: 'Great review session',
      },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary') {
    return (
      <FlashcardSummary
        cards={reviewCards}
        masteryStatsByCard={masteryStatsRef.current}
        totalTimeSec={totalTimeSec}
        returnHref="/home"
      />
    );
  }

  if (phase === 'typing') {
    return (
      <FlashcardTypingDrill
        cards={reviewCards}
        onComplete={handleTypingComplete}
        onExit={handleExit}
        masteryStatsRef={masteryStatsRef}
      />
    );
  }

  return (
    <FlashcardReview
      cards={reviewCards}
      onRate={handleRate}
      onComplete={handleReviewComplete}
      onExit={handleExit}
      masteryStatsRef={masteryStatsRef}
    />
  );
}
