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

export function parseQuizletImport(payload, options) {
  return callStudy('parseQuizletImport', payload, options);
}

export function extractDeckSource(payload, options) {
  return callStudy('extractDeckSource', payload, options);
}

export function findFlashcardDuplicates(payload, options) {
  return callStudy('findFlashcardDuplicates', payload, options);
}

export function applyDeckAiEdit(payload, options) {
  return callStudy('applyDeckAiEdit', payload, options);
}

export function generateDiagnosticQuestions(payload, options) {
  return callStudy('generateDiagnosticQuestions', payload, options);
}

export function feynmanConversationTurn(payload, options) {
  return callStudy('feynmanConversationTurn', payload, options);
}

export function feynmanSummarizeConcept(payload, options) {
  return callStudy('feynmanSummarizeConcept', payload, options);
}

export function gradeFreeRecall(payload, options) {
  return callStudy('gradeFreeRecall', payload, options);
}

export function generateFreeRecallHint(payload, options) {
  return callStudy('generateFreeRecallHint', payload, options);
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
