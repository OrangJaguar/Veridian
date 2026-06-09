import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizSetupForm from '@/components/study/quiz/QuizSetupForm';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generatePracticeQuestions, generateConceptRefresher } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useSessions } from '@/hooks/queries/useSessions';
import { getWeakConceptIds, getRecentQuestionIds } from '@/utils/study/conceptWeakness';

export default function PracticeQuizSession({ session, activity, module, journeyId }) {
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState(activity.content?.lastConfig ?? {});
  const [loading, setLoading] = useState(false);
  const [summaryAccuracy, setSummaryAccuracy] = useState(null);
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const { data: sessions = [] } = useSessions(journeyId);

  const knowledgeMap = module?.knowledgeMap ?? {};

  const handleStart = async (setupConfig) => {
    setLoading(true);
    try {
      const result = await generatePracticeQuestions({
        knowledgeMap,
        questionCount: setupConfig.questionCount,
        focusPreset: setupConfig.focusPreset,
        weakConceptIds: getWeakConceptIds(sessions, module?.moduleId),
        recentQuestionIds: getRecentQuestionIds(sessions, module?.moduleId),
      });
      setQuestions(result.data?.questions ?? result.questions ?? []);
      setConfig(setupConfig);
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleIntervention = async (conceptId) => {
    try {
      const concept = (knowledgeMap.concepts ?? []).find((c) => c.id === conceptId);
      const result = await generateConceptRefresher({ concept, knowledgeMap });
      setRefresherContent(result.data ?? result);
    } catch {
      setRefresherContent({ recap: 'Review this concept in your notes.', example: '' });
    }
  };

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = { config, questions, answers, interventions: [] };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: accuracy,
      outcomeSummary: {
        accuracy,
        itemsCompleted: answers.length,
        weakConcepts: answers.filter((a) => !a.correct).map((a) => a.conceptId).filter(Boolean),
        nextAction: accuracy >= 70 ? 'Try Stage C activities' : 'Run another Weak Spots quiz',
      },
      startedAt: session.startedAt,
    });
    setSummaryAccuracy(accuracy);
    setPhase('summary');
  };

  const returnPath = module?.moduleId
    ? `/journeys/${journeyId}/modules/${module.moduleId}`
    : `/journeys/${journeyId}`;

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Quiz complete"
        stats={[{ label: 'Accuracy', value: `${summaryAccuracy ?? '—'}%` }]}
        nextAction="Keep practicing weak spots or move to flashcards."
        returnHref={returnPath}
      />
    );
  }

  return (
    <StudyChrome
      title="Practice Quiz"
      progressText={phase === 'active' ? `Quiz · ${module?.name ?? ''}` : 'Setup'}
      onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}
    >
      {phase === 'setup' && (
        <QuizSetupForm defaultConfig={config} onStart={handleStart} loading={loading} />
      )}
      {phase === 'active' && (
        <QuizRunner
          questions={questions}
          onComplete={handleComplete}
          onIntervention={handleIntervention}
          refresherContent={refresherContent}
        />
      )}
    </StudyChrome>
  );
}
