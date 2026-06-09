const MOCK_QUESTIONS = [
  {
    id: 'mq1',
    type: 'multipleChoice',
    stem: 'What is the primary purpose of spaced repetition?',
    options: ['Cram before exams', 'Review at optimal intervals', 'Replace active recall', 'Skip weak topics'],
    correctAnswer: 'Review at optimal intervals',
    explanation: 'FSRS schedules reviews when you are about to forget.',
    conceptId: 'c1',
  },
  {
    id: 'mq2',
    type: 'trueFalse',
    stem: 'Active recall is more effective than re-reading notes.',
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanation: 'Retrieval practice strengthens memory more than passive review.',
    conceptId: 'c2',
  },
];

const MOCK_GUIDE = {
  sections: [
    {
      sectionId: 's1',
      title: 'Core Concept',
      explanation: 'This is a concise plain-language explanation of the module concept.',
      workedExamples: [{
        scenario: 'Sample problem',
        steps: ['Identify given values', 'Apply the formula', 'Check units'],
        answer: '42',
        reasoning: 'Each step builds on the prior one.',
      }],
      checkInQuestion: {
        question: 'What is the main idea of this section?',
        type: 'multipleChoice',
        options: ['Option A', 'Option B', 'The core concept'],
        correctAnswer: 'The core concept',
        explanation: 'The section focused on the foundational idea.',
      },
      externalSearchSuggestions: ['Topic Khan Academy', 'Topic overview YouTube'],
      narrationText: 'This section explains the core concept in plain language.',
    },
  ],
  totalSections: 1,
  estimatedMinutes: 8,
};

const MOCK_CARDS = [
  { front: 'Term A', back: 'Definition A', conceptTag: 'c1' },
  { front: 'Term B', back: 'Definition B', conceptTag: 'c2' },
];

export function getMockStudyResponse(action, payload) {
  switch (action) {
    case 'generateLearningGuide':
      return { data: MOCK_GUIDE };
    case 'generatePracticeQuestions':
    case 'generateInterleavedQuestions':
    case 'generateJourneyChallenge':
    case 'generateSynthesisQuestions':
      return { data: { questions: MOCK_QUESTIONS.slice(0, payload.questionCount ?? 2) } };
    case 'generateFlashcards':
      return { data: { cards: MOCK_CARDS } };
    case 'gradeFeynman':
      return {
        data: {
          aiFeedback: 'Good start — you covered the basics but missed a key mechanism.',
          missingConcepts: ['mechanism'],
          misconceptionsDetected: [],
          weakestPoint: 'The causal chain is incomplete.',
          followUpQuestion: 'Can you explain why step 2 leads to step 3?',
          overallConfidenceRating: 'partial',
        },
      };
    case 'gradeFreeRecall':
      return {
        data: {
          coveragePercent: 72,
          conceptsCovered: ['c1', 'c2'],
          conceptsMissed: ['c3'],
          incorrectIdeas: [],
          aiGradingSummary: 'Solid recall with a few gaps in advanced topics.',
          nextConceptRecommendation: 'Review concept c3 next.',
        },
      };
    case 'generateConceptRefresher':
      return {
        data: {
          recap: 'Quick recap: the concept links A to B through a defined process.',
          example: 'For instance, when X increases, Y follows predictably.',
        },
      };
    case 'generateCramSession':
      return { data: { questions: MOCK_QUESTIONS, focusConcepts: ['c1', 'c2'] } };
    default:
      return { data: {} };
  }
}
