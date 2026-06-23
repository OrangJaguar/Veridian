import { useState, useCallback } from 'react';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';

/**
 * Persist pre-quiz confidence slider value to session before quiz starts.
 */
export function usePreQuizConfidence({ session, journeyId, onContinue }) {
  const updateSession = useUpdateSession();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (value) => {
    const confidenceSlider = {
      value,
      submittedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: {
          sessionData: {
            ...session.sessionData,
            confidenceSlider,
          },
        },
      });
      onContinue?.(confidenceSlider);
    } finally {
      setSubmitting(false);
    }
  }, [journeyId, onContinue, session.sessionData, session.sessionId, updateSession]);

  const needsConfidence = !session.sessionData?.confidenceSlider?.submittedAt;

  return { handleSubmit, submitting, needsConfidence };
}
