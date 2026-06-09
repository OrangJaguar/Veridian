import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
// import { generateCramSession } from '@/api/ai/study';
import { pickQuestions } from '@/fixtures/starterJourney/aiJourneyContent';
import { getDueCards } from '@/utils/fsrs';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useSessions } from '@/hooks/queries/useSessions';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';

export default function CramSession({ session, activity, journeyId, modules = [], cards = [] }) {
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}`;

  const challengeActivity = activities.find((a) => a.type === 'journeyChallenge');
  const preloaded = challengeActivity?.content?.questions ?? [];

  const weakConcepts = useMemo(
    () => modules.flatMap((m) => getWeakConceptIds(sessions, m.moduleId, 5)),
    [modules, sessions],
  );
  const overdueCount = getDueCards(cards).length;

  useEffect(() => {
    if (preloaded.length > 0) {
      setQuestions(pickQuestions(preloaded, 8));
      setPhase('active');
      return;
    }
    toast.error('No cram questions available.');
    setPhase('error');
    // AI generation (disabled):
    // generateCramSession({ weakConceptIds, overdueCardCount, moduleNames })
  }, []);

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = {
      itemsCompleted: answers.length,
      weakConcepts: [...new Set(weakConcepts)],
      dangerousAreas: weakConcepts.slice(0, 3),
      nextAction: 'Review overdue cards and weakest modules before exam',
      cramMode: true,
      quizQuestions: answers.length,
      overdueCards: overdueCount,
    };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: sessionData.nextAction },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Cram session complete"
        nextAction="Prioritize overdue cards and weak concepts before your exam."
        returnHref={returnPath}
      />
    );
  }

  return (
    <StudyChrome title="Cram Mode" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'loading' && <p className="journeys-status">Building your cram session…</p>}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
      {phase === 'error' && <p className="journeys-error">Could not build cram session.</p>}
    </StudyChrome>
  );
}
