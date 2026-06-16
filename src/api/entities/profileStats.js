import { listJourneys } from '@/api/entities/journeys';
import { listAllSessions } from '@/api/entities/sessions';
import { requireAuth } from '@/api/requireAuth';

const REVIEW_ACTIVITY_TYPES = new Set(['flashcards', 'practice_quiz', 'quiz']);

export async function getProfileStats() {
  await requireAuth();
  const [journeys, sessions] = await Promise.all([
    listJourneys({ archived: false }),
    listAllSessions(),
  ]);

  const completed = sessions.filter((s) => s.status === 'completed');
  const totalStudyTimeMs = completed.reduce(
    (sum, s) => sum + (s.sessionDurationMs ?? (s.durationSec ? s.durationSec * 1000 : 0)),
    0,
  );
  const reviewSessions = completed.filter((s) => REVIEW_ACTIVITY_TYPES.has(s.activityType)).length;

  return {
    activeJourneys: journeys.length,
    totalStudyTimeMs,
    reviewSessions,
    completedSessions: completed.length,
  };
}
