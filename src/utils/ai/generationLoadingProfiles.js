/** @typedef {'short' | 'long'} GenerationLoadingMode */

/**
 * @typedef {Object} GenerationLoadingProfile
 * @property {GenerationLoadingMode} mode
 * @property {string} label
 * @property {string[]} steps
 * @property {string} [patienceNote] - Shown on long flows so users know to wait
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
    patienceNote: 'AI is building the full guide in one pass — this may take a minute.',
  },
  proposeJourney: {
    mode: 'long',
    label: 'Building your Journey…',
    steps: ['Reading sources', 'Mapping concepts', 'Building modules'],
    patienceNote: 'Building your journey in one AI pass (up to 2 attempts if needed).',
  },
  regenerateModules: {
    mode: 'long',
    label: 'Restructuring your modules…',
    steps: ['Reading sources', 'Mapping concepts', 'Building modules'],
    patienceNote: 'Restructuring modules can take a few minutes — hang tight.',
  },
  generateDiagnosticQuestions: {
    mode: 'short',
    label: 'Building your module check…',
    steps: ['Analyzing concepts', 'Writing questions', 'Finalizing'],
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
  rawAiDump: {
    mode: 'short',
    label: 'Fetching raw AI response…',
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