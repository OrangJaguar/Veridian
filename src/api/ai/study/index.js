import { invokeGeminiStudy, parseGeminiStudyResponse } from '@/api/ai/studyClient';
import { getActiveStudyAiTrace, isStudyAiDebugEnabled, isRawDumpEnabled } from '@/utils/study/studyAiTrace';

async function callStudy(action, payload, options) {
  const trace = getActiveStudyAiTrace();
  const rawDump = isRawDumpEnabled();

  let result;
  try {
    result = await invokeGeminiStudy(action, payload, options);
  } catch (err) {
    throw err;
  }

  const parseStart = Date.now();
  if (isStudyAiDebugEnabled() && trace) {
    trace.stepStart('1b_parse', rawDump ? 'Raw dump response (skip parse)' : 'Parse geminiStudy response', {
      resultKeys: Object.keys(result ?? {}),
      hasDebug: Boolean(result?._debug),
      hasRaw: Boolean(result?.rawGeminiText ?? result?.data?.rawGeminiText),
    });
  }

  try {
    const parsed = parseGeminiStudyResponse(result);
    if (isStudyAiDebugEnabled() && trace) {
      trace.stepOk('1b_parse', rawDump ? 'Raw dump response' : 'Parse geminiStudy response', trace.summarizeCounts(parsed), Date.now() - parseStart);
    }
    return parsed;
  } catch (err) {
    if (isStudyAiDebugEnabled() && trace) {
      trace.stepFail('1b_parse', 'Parse geminiStudy response', err, {
        resultKeys: Object.keys(result ?? {}),
        serverDebug: result?._debug ?? window.__veridianLastServerAiDebug,
      }, Date.now() - parseStart);
    }
    throw err;
  }
}

/** Fetch raw Gemini text only — no server-side validation. Requires raw dump mode + published geminiStudy. */
export function fetchGeminiStudyRaw(action, payload, options) {
  return callStudy(action, payload, options);
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
