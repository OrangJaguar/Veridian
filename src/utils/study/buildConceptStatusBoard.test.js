import { describe, it, expect } from 'vitest';
import { buildConceptStatusBoard, CONCEPT_STATUS } from './buildConceptStatusBoard';
import { normalizeConceptRelations } from '@/utils/schemas/ai/knowledgeMap';
import { resolvePostQuizNextActivity } from './resolvePostQuizNextActivity';

describe('buildConceptStatusBoard', () => {
  it('marks concepts with no evidence as unseen', () => {
    const rows = buildConceptStatusBoard({
      module: {
        moduleId: 'm1',
        journeyId: 'j1',
        knowledgeMap: {
          concepts: [{ id: 'c1', term: 'Entropy', definition: 'Disorder' }],
        },
      },
      sessions: [],
      cards: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe(CONCEPT_STATUS.unseen);
  });

  it('marks weak quiz performance as fragile', () => {
    const rows = buildConceptStatusBoard({
      module: {
        moduleId: 'm1',
        journeyId: 'j1',
        knowledgeMap: {
          concepts: [{ id: 'c1', term: 'Entropy', definition: 'Disorder' }],
        },
      },
      sessions: [{
        status: 'completed',
        activityType: 'practiceQuiz',
        moduleId: 'm1',
        startedAt: Date.now(),
        sessionData: {
          questions: [
            { id: 'q1', conceptId: 'c1' },
            { id: 'q2', conceptId: 'c1' },
          ],
          answers: [
            { questionId: 'q1', correct: false },
            { questionId: 'q2', correct: false },
          ],
        },
      }],
      cards: [],
    });
    expect(rows[0].status).toBe(CONCEPT_STATUS.fragile);
  });
});

describe('normalizeConceptRelations', () => {
  it('drops dangling and self edges', () => {
    const concepts = [{ id: 'a' }, { id: 'b' }];
    const rels = normalizeConceptRelations([
      { fromConceptId: 'a', toConceptId: 'b', type: 'prerequisite' },
      { fromConceptId: 'a', toConceptId: 'a', type: 'related' },
      { fromConceptId: 'a', toConceptId: 'missing', type: 'related' },
      { fromConceptId: 'a', toConceptId: 'b', type: 'prerequisite' },
    ], concepts);
    expect(rels).toEqual([
      { fromConceptId: 'a', toConceptId: 'b', type: 'prerequisite' },
    ]);
  });
});

describe('resolvePostQuizNextActivity', () => {
  it('falls back to weak-spots quiz when concepts are shaky', () => {
    const next = resolvePostQuizNextActivity({
      module: { moduleId: 'm1', name: 'Cells', failureEvidence: null },
      journeyId: 'j1',
      activities: [{ moduleId: 'm1', activityId: 'quiz1', type: 'practiceQuiz' }],
      conceptResults: [
        { conceptId: 'c1', term: 'Mitosis', status: 'needs_work' },
      ],
      accuracy: 40,
    });
    expect(next.activityId).toBe('quiz1');
    expect(next.quizConfig.focusPreset).toBe('weakSpots');
  });
});
