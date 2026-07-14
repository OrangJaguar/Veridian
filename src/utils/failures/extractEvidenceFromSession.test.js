import { describe, it, expect } from 'vitest';
import { extractEvidenceFromSession } from '@/utils/failures/extractEvidenceFromSession';

const module = {
  moduleId: 'm1',
  knowledgeMap: {
    concepts: [
      { id: 'c1', term: 'Alpha' },
      { id: 'c2', term: 'Beta' },
      { id: 'c3', term: 'Gamma' },
    ],
  },
};

describe('extractEvidenceFromSession — practiceQuiz', () => {
  it('maps variant misses to failure modes', () => {
    const session = {
      sessionId: 'q1',
      activityType: 'practiceQuiz',
      endedAt: Date.now(),
      sessionData: {
        questions: [
          { id: 'q-a', conceptId: 'c1', variantType: 'verbatim' },
          { id: 'q-b', conceptId: 'c2', variantType: 'transfer' },
        ],
        answers: [
          { questionId: 'q-a', correct: false },
          { questionId: 'q-b', correct: false },
        ],
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'practiceQuiz' }, module);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'c1', modeId: 'verbatim_trap' }),
      expect.objectContaining({ conceptId: 'c2', modeId: 'transfer_failure' }),
    ]));
  });

  it('adds pressure_collapse on timed quiz with misses', () => {
    const session = {
      sessionId: 'q-timed',
      activityType: 'practiceQuiz',
      endedAt: Date.now(),
      sessionData: {
        config: { timedMode: true },
        questions: [{ id: 'q1', conceptId: 'c1' }],
        answers: [{ questionId: 'q1', correct: false }],
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'practiceQuiz' }, module);
    expect(result.moduleHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ modeId: 'pressure_collapse' }),
    ]));
  });

  it('records interference on matching miss', () => {
    const session = {
      sessionId: 'm-match',
      activityType: 'practiceQuiz',
      endedAt: Date.now(),
      sessionData: {
        questions: [{
          id: 'q1',
          conceptId: 'c1',
          type: 'matching',
        }],
        answers: [{ questionId: 'q1', correct: false, response: { A: 'wrong' } }],
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'practiceQuiz' }, module);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'c1', modeId: 'interference' }),
    ]));
  });
});

describe('extractEvidenceFromSession — flashcardSet', () => {
  it('records retention_decay on again ratings', () => {
    const session = {
      sessionId: 'fc1',
      activityType: 'flashcardSet',
      endedAt: Date.now(),
      sessionData: {
        reviews: [
          { cardId: 'card1', rating: 'again' },
          { cardId: 'card2', rating: 'good' },
        ],
      },
    };
    const cards = [
      { cardId: 'card1', conceptId: 'c1' },
      { cardId: 'card2', conceptId: 'c2' },
    ];

    const result = extractEvidenceFromSession(session, { type: 'flashcardSet' }, module, cards);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'c1', modeId: 'retention_decay' }),
    ]));
  });

  it('adds verbatim_trap after 3+ again on same concept', () => {
    const session = {
      sessionId: 'fc2',
      activityType: 'flashcardSet',
      endedAt: Date.now(),
      sessionData: {
        reviews: [
          { cardId: 'a', rating: 'again' },
          { cardId: 'b', rating: 'again' },
          { cardId: 'c', rating: 'again' },
        ],
      },
    };
    const cards = [
      { cardId: 'a', conceptId: 'c1' },
      { cardId: 'b', conceptId: 'c1' },
      { cardId: 'c', conceptId: 'c1' },
    ];

    const result = extractEvidenceFromSession(session, { type: 'flashcardSet' }, module, cards);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'c1', modeId: 'verbatim_trap', weight: 1 }),
    ]));
  });
});

describe('extractEvidenceFromSession — learningGuide', () => {
  it('records understanding_gap on failed check-in', () => {
    const session = {
      sessionId: 'g1',
      activityType: 'learningGuide',
      endedAt: Date.now(),
      sessionData: {
        checkInResults: [{ sectionId: 's1', correct: false }],
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'learningGuide' }, module);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ modeId: 'understanding_gap' }),
    ]));
  });
});

describe('extractEvidenceFromSession — feynman', () => {
  it('records understanding_gap from low confidence', () => {
    const session = {
      sessionId: 'fy1',
      activityType: 'feynman',
      endedAt: Date.now(),
      sessionData: {
        conceptThreads: {
          c1: { summary: { confidencePercent: 35 } },
        },
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'feynman' }, module);
    expect(result.conceptHits).toEqual([
      expect.objectContaining({ conceptId: 'c1', modeId: 'understanding_gap', weight: 2 }),
    ]);
  });
});

describe('extractEvidenceFromSession — freeRecall', () => {
  it('records understanding_gap and verbatim_trap from coverage', () => {
    const session = {
      sessionId: 'fr1',
      activityType: 'freeRecall',
      endedAt: Date.now(),
      sessionData: {
        hintsUsed: 2,
        conceptCoverage: [
          { conceptId: 'c1', status: 'missed' },
          { conceptId: 'c2', status: 'partial' },
        ],
      },
    };

    const result = extractEvidenceFromSession(session, { type: 'freeRecall' }, module);
    expect(result.conceptHits).toEqual(expect.arrayContaining([
      expect.objectContaining({ conceptId: 'c1', modeId: 'understanding_gap' }),
      expect.objectContaining({ conceptId: 'c2', modeId: 'verbatim_trap' }),
    ]));
  });
});
