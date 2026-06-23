import { useState } from 'react';
import PreQuizConfidenceStep from '@/components/research/PreQuizConfidenceStep';
import { usePreQuizConfidence } from '@/hooks/research/usePreQuizConfidence';

/**
 * Renders PreQuizConfidenceStep or children based on phase.
 */
export default function QuizConfidenceGate({
  phase,
  session,
  journeyId,
  onPhaseActive,
  onExit,
  children,
}) {
  const [confidenceSlider, setConfidenceSlider] = useState(
    () => session.sessionData?.confidenceSlider ?? null,
  );
  const { handleSubmit, submitting } = usePreQuizConfidence({
    session: {
      ...session,
      sessionData: {
        ...session.sessionData,
        confidenceSlider: confidenceSlider ?? session.sessionData?.confidenceSlider,
      },
    },
    journeyId,
    onContinue: (slider) => {
      setConfidenceSlider(slider);
      onPhaseActive?.(slider);
    },
  });

  if (phase === 'confidence') {
    return (
      <PreQuizConfidenceStep
        onSubmit={handleSubmit}
        onExit={onExit}
        submitting={submitting}
      />
    );
  }

  return children(confidenceSlider ?? session.sessionData?.confidenceSlider);
}
