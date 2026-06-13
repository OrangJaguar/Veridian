import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import VeridianLoading from '@/components/shared/VeridianLoading';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generateCramSession } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { getDueCards } from '@/utils/fsrs';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useSessions } from '@/hooks/queries/useSessions';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function CramSession({ session, activity, journeyId, modules = [], cards = [] }) {
  const { data: journey } = useJourney(journeyId);
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const { data: sessions = [] } = useSessions(journeyId);
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}`;

  const weakConcepts = useMemo(
    () => modules.flatMap((m) => getWeakConceptIds(sessions, m.moduleId, 5)),
    [modules, sessions],
  );
  const overdueCount = getDueCards(cards).length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await generateCramSession({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          questionCount: 8,
          weakConceptIds: weakConcepts,
          overdueCardCount: overdueCount,
          moduleNames: modules.map((m) => m.name),
          moduleMaps: modules.map((m) => ({
            moduleId: m.moduleId,
            name: m.name,
            concepts: m.knowledgeMap?.concepts ?? [],
          })),
        });
        if (cancelled) return;
        setQuestions(normalizeQuizQuestions(raw, 8));
        setPhase('active');
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || 'Failed to generate cram session');
          setPhase('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [journey, modules, weakConcepts, overdueCount]);

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / answers.length) * 100) : 0;
    const sessionData = {
      itemsCompleted: answers.length,
      questions,
      answers,
      weakConcepts,
      overdueCount,
    };
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review missed concepts tomorrow' },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'loading') {
    return (
      <StudyChrome title="Cram Mode" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
        <VeridianLoading />
      </StudyChrome>
    );
  }

  if (phase === 'summary') {
    return <SessionSummary title="Cram session complete" returnHref={returnPath} />;
  }

  if (phase === 'error') {
    return (
      <StudyChrome title="Cram Mode" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
        <p className="journeys-status">Could not load cram questions.</p>
      </StudyChrome>
    );
  }

  return (
    <StudyChrome title="Cram Mode" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      <QuizRunner questions={questions} onComplete={handleComplete} />
    </StudyChrome>
  );
}
