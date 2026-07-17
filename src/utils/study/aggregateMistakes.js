const QUIZ_TYPES = new Set([
  'practiceQuiz', 'interleavedReview', 'cramSession', 'journeyChallenge',
]);

/**
 * Extract and deduplicate wrong answers from completed quiz-type sessions.
 * Returns most-recent-first, deduplicated by stem.
 */
export function aggregateMistakes(sessions, journeyId) {
  const relevant = (sessions ?? [])
    .filter((s) =>
      s.status === 'completed'
      && QUIZ_TYPES.has(s.activityType)
      && (!journeyId || s.journeyId === journeyId),
    )
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

  const mistakes = [];
  const seenStems = new Set();

  for (const session of relevant) {
    const answers = session.sessionData?.answers;
    if (!Array.isArray(answers)) continue;

    const questions = session.sessionData?.questions;
    const questionMap = {};
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q.id) questionMap[q.id] = q;
      }
    }

    for (const ans of answers) {
      if (ans.correct !== false) continue;

      const question = questionMap[ans.questionId];
      const stem = question?.stem ?? ans.questionId ?? '';
      if (!stem || seenStems.has(stem)) continue;
      seenStems.add(stem);

      mistakes.push({
        stem,
        correctAnswer: question?.correctAnswer ?? null,
        userResponse: ans.response ?? null,
        conceptId: ans.conceptId ?? null,
        sessionId: session.sessionId,
        activityType: session.activityType,
        journeyId: session.journeyId,
        moduleId: session.moduleId ?? null,
        timestamp: session.startedAt,
        explanation: question?.explanation ?? null,
        options: question?.options ?? null,
        type: question?.type ?? 'multipleChoice',
      });
    }
  }

  return mistakes;
}
