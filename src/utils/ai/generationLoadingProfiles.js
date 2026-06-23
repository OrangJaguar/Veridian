/** @typedef {'short' | 'long'} GenerationLoadingMode */

/**
 * @typedef {Object} GenerationLoadingProfile
 * @property {GenerationLoadingMode} mode
 * @property {string} label
 * @property {string[]} steps
 */

/** @type {Record<string, GenerationLoadingProfile>} */
export const GENERATION_LOADING_PROFILES = {
  generatePracticeQuestions: {
    mode: 'short',
    label: 'Writing your practice questions…',
    steps: ['Analyzing concepts', 'Writing questions', 'Finalizing'],
  },
  generateFlashcards: {
    mode: 'short',
    label: 'Building your flashcard deck…',
    steps: ['Parsing material', 'Building cards', 'Saving deck'],
  },
  saveDeck: {
    mode: 'short',
    label: 'Saving your deck…',
    steps: [],
  },
  generateLearningGuide: {
    mode: 'long',
    label: 'Generating your learning guide…',
    steps: ['Planning sections', 'Writing explanations', 'Adding examples', 'Creating check-ins'],
  },
  proposeJourney: {
    mode: 'long',
    label: 'Building your Journey…',
    steps: ['Reading sources', 'Mapping concepts', 'Building modules'],
  },
  regenerateModules: {
    mode: 'long',
    label: 'Restructuring your modules…',
    steps: ['Reading sources', 'Mapping concepts', 'Building modules'],
  },
  generateDiagnosticQuestions: {
    mode: 'long',
    label: 'Building your diagnostic…',
    steps: ['Analyzing modules', 'Writing questions', 'Balancing difficulty', 'Finalizing'],
  },
  generateInterleavedQuestions: {
    mode: 'short',
    label: 'Generating interleaved questions…',
    steps: ['Mixing modules', 'Writing questions', 'Finalizing'],
  },
  generateJourneyChallenge: {
    mode: 'short',
    label: 'Generating challenge questions…',
    steps: ['Analyzing journey', 'Writing questions', 'Finalizing'],
  },
  generateCramSession: {
    mode: 'short',
    label: 'Generating cram questions…',
    steps: ['Analyzing weak spots', 'Writing questions', 'Finalizing'],
  },
  gradeFreeRecall: {
    mode: 'short',
    label: 'Grading your recall…',
    steps: ['Reviewing response', 'Scoring coverage'],
  },
  feynmanSummarizeConcept: {
    mode: 'short',
    label: 'Building your summary…',
    steps: ['Reviewing conversation', 'Summarizing insights'],
  },
  applyDeckAiEdit: {
    mode: 'short',
    label: 'Updating your deck…',
    steps: ['Analyzing cards', 'Applying edits'],
  },
  rawGeminiDump: {
    mode: 'short',
    label: 'Fetching raw Gemini response…',
    steps: [],
  },
};

/**
 * @param {string} action
 * @returns {GenerationLoadingProfile}
 */
export function getGenerationLoadingProfile(action) {
  return GENERATION_LOADING_PROFILES[action] ?? {
    mode: 'short',
    label: 'Generating…',
    steps: [],
  };
}
