import { invokeGeminiStudy, parseGeminiStudyResponse } from '@/api/ai/studyClient';

async function callStudy(action, payload, options) {
  const result = await invokeGeminiStudy(action, payload, options);
  return parseGeminiStudyResponse(result);
}

export function generateLearningGuide(payload, options) {
  return callStudy('generateLearningGuide', payload, options);
}

export function generatePracticeQuestions(payload, options) {
  return callStudy('generatePracticeQuestions', payload, options);
}

export function generateFlashcards(payload, options) {
  return callStudy('generateFlashcards', payload, options);
}

export function gradeFeynman(payload, options) {
  return callStudy('gradeFeynman', payload, options);
}

export function gradeFreeRecall(payload, options) {
  return callStudy('gradeFreeRecall', payload, options);
}

export function generateSynthesisQuestions(payload, options) {
  return callStudy('generateSynthesisQuestions', payload, options);
}

export function generateInterleavedQuestions(payload, options) {
  return callStudy('generateInterleavedQuestions', payload, options);
}

export function generateJourneyChallenge(payload, options) {
  return callStudy('generateJourneyChallenge', payload, options);
}

export function generateConceptRefresher(payload, options) {
  return callStudy('generateConceptRefresher', payload, options);
}

export function generateCramSession(payload, options) {
  return callStudy('generateCramSession', payload, options);
}
