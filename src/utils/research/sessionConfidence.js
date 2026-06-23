import { requiresConfidenceSlider } from '@/utils/research/quizSessionTypes';

export function quizPhaseAfterQuestions(session, defaultIfNoQuestions = 'setup') {
  if (session.status === 'completed' && session.sessionData?.answers?.length) {
    return 'summary';
  }
  if (session.sessionData?.questions?.length) {
    return session.sessionData?.confidenceSlider?.submittedAt ? 'active' : 'confidence';
  }
  return defaultIfNoQuestions;
}

export function withConfidenceSlider(sessionData, sourceSessionData) {
  const slider = sourceSessionData?.confidenceSlider ?? sessionData?.confidenceSlider;
  if (!slider?.submittedAt) return sessionData;
  return { ...sessionData, confidenceSlider: slider };
}

export function assertConfidenceSliderPresent(sessionData, activityType) {
  if (!requiresConfidenceSlider(activityType)) return;
  if (!sessionData?.confidenceSlider?.submittedAt) {
    throw new Error('Confidence slider response is required before completing this session.');
  }
}
