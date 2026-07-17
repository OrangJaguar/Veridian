import { describe, it, expect } from 'vitest';
import { buildSessionTrapDebrief } from './buildSessionTrapDebrief';

function makeQuizSession({ answers, timed = false }) {
  return {
    sessionId: 's1',
    activityType: 'practiceQuiz',
    endedAt: Date.now(),
    sessionData: {
      quizConfig: timed ? { strictTimedMode: true } : {},
      questions: [
        { id: 'q1', conceptId: 'c1', type: 'multipleChoice', variantType: 'verbatim' },
        { id: 'q2', conceptId: 'c1', type: 'multipleChoice', variantType: 'verbatim' },
        { id: 'q3', conceptId: 'c2', type: 'multipleChoice', variantType: 'transfer' },
      ],
      answers,
    },
  };
}

describe('buildSessionTrapDebrief', () => {
  it('suppresses low-confidence session claims', () => {
    const session = makeQuizSession({
      answers: [{ questionId: 'q1', correct: false, conceptId: 'c1' }],
    });
    const module = {
      moduleId: 'm1',
      knowledgeMap: { concepts: [{ id: 'c1', term: 'A' }, { id: 'c2', term: 'B' }] },
      failureEvidence: { version: 1, concepts: {}, moduleLevel: {}, processedSessionIds: [] },
    };
    const debrief = buildSessionTrapDebrief({ session, module });
    expect(debrief.sessionHits.length).toBeGreaterThan(0);
    expect(debrief.primaryMode).toBeNull();
    expect(debrief.suppressed).toBe(true);
  });

  it('surfaces an emerging session primary with enough hits', () => {
    const session = makeQuizSession({
      answers: [
        { questionId: 'q1', correct: false, conceptId: 'c1' },
        { questionId: 'q2', correct: false, conceptId: 'c1' },
      ],
    });
    const module = {
      moduleId: 'm1',
      knowledgeMap: { concepts: [{ id: 'c1', term: 'A' }, { id: 'c2', term: 'B' }] },
      failureEvidence: { version: 1, concepts: {}, moduleLevel: {}, processedSessionIds: [] },
    };
    const debrief = buildSessionTrapDebrief({ session, module });
    expect(debrief.primaryMode).toBe('verbatim_trap');
    expect(debrief.suppressed).toBe(false);
  });
});
