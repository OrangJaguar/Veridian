import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSession } from '@/hooks/queries/useSessions';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useModules } from '@/hooks/queries/useModules';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import { useStudySessionStore } from '@/store/studySessionStore';
import PracticeQuizSession from '@/pages/study/modes/PracticeQuizSession';
import FlashcardSession from '@/pages/study/modes/FlashcardSession';
import LearningGuideSession from '@/pages/study/modes/LearningGuideSession';
import FeynmanSession from '@/pages/study/modes/FeynmanSession';
import FreeRecallSession from '@/pages/study/modes/FreeRecallSession';
import SynthesisSession from '@/pages/study/modes/SynthesisSession';
import InterleavedSession from '@/pages/study/modes/InterleavedSession';
import JourneyChallengeSession from '@/pages/study/modes/JourneyChallengeSession';
import CramSession from '@/pages/study/modes/CramSession';

export default function StudyShell() {
  const { sessionId } = useParams();
  const { data: session, isLoading, error } = useSession(sessionId);
  const journeyId = session?.journeyId;
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const { data: cards = [] } = useCardsByJourney(journeyId);
  const hydrate = useStudySessionStore((s) => s.hydrate);

  const activity = activities.find((a) => a.activityId === session?.activityId);
  const module = modules.find((m) => m.moduleId === session?.moduleId);
  const activityCards = cards.filter((c) => c.activityId === session?.activityId);

  useEffect(() => {
    if (session && activity) hydrate({ session, activity });
  }, [session, activity, hydrate]);

  if (isLoading) {
    return <div className="study-shell-loading"><p className="journeys-status">Loading session…</p></div>;
  }

  if (error || !session) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Session not found</h1>
        <Link to="/home" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  if (session.status === 'completed' || session.status === 'abandoned') {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Session ended</h1>
        <p className="stub-description">This study session is already {session.status}.</p>
        <Link to={module ? `/journeys/${journeyId}/modules/${module.moduleId}` : `/journeys/${journeyId}`} className="btn btn-primary">
          Go back
        </Link>
      </div>
    );
  }

  const props = { session, activity, module, journeyId, modules, cards: activityCards };

  if (session.sessionData?.cramMode) {
    return <CramSession {...props} cards={cards} />;
  }

  switch (session.activityType) {
    case 'practiceQuiz':
      return <PracticeQuizSession {...props} />;
    case 'flashcardSet':
      return <FlashcardSession {...props} />;
    case 'learningGuide':
      return <LearningGuideSession {...props} />;
    case 'feynman':
      return <FeynmanSession {...props} />;
    case 'freeRecall':
      return <FreeRecallSession {...props} />;
    case 'synthesis':
      return <SynthesisSession {...props} modules={modules} />;
    case 'interleavedReview':
      return <InterleavedSession {...props} modules={modules} />;
    case 'journeyChallenge':
      return <JourneyChallengeSession {...props} modules={modules} />;
    default:
      return (
        <div className="stub-page">
          <h1 className="stub-title">Unknown activity type</h1>
          <p>{session.activityType}</p>
        </div>
      );
  }
}
