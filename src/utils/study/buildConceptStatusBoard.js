import { getCardHealth } from '@/utils/fsrs';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { parseDiagnosticSummary } from '@/utils/study/conceptPerformance';

const STATUS = {
  unseen: 'unseen',
  developing: 'developing',
  fragile: 'fragile',
  solid: 'solid',
};

function conceptLabel(concept) {
  return concept?.term ?? concept?.id ?? 'Concept';
}

function normalizeTag(value) {
  return String(value ?? '').trim().toLowerCase();
}

function quizStatsByConcept(sessions = [], moduleId) {
  const byConcept = {};
  const relevant = (sessions ?? [])
    .filter((s) => s.status === 'completed'
      && s.activityType === 'practiceQuiz'
      && (!moduleId || s.moduleId === moduleId))
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .slice(0, 12);

  for (const session of relevant) {
    const questions = session.sessionData?.questions ?? [];
    const answers = session.sessionData?.answers ?? [];
    const answerById = Object.fromEntries(answers.map((a) => [a.questionId, a]));
    for (const q of questions) {
      const conceptId = q.conceptId;
      if (!conceptId) continue;
      if (!byConcept[conceptId]) {
        byConcept[conceptId] = {
          attempts: 0,
          correct: 0,
          lastAt: session.startedAt ?? null,
        };
      }
      const ans = answerById[q.id];
      if (!ans || ans.skipped) continue;
      byConcept[conceptId].attempts += 1;
      if (ans.correct) byConcept[conceptId].correct += 1;
      if (session.startedAt && (!byConcept[conceptId].lastAt || session.startedAt > byConcept[conceptId].lastAt)) {
        byConcept[conceptId].lastAt = session.startedAt;
      }
    }
  }
  return byConcept;
}

function fsrsByConcept(cards = [], concepts = []) {
  const byId = {};
  const termToId = {};
  for (const c of concepts) {
    const id = c.id ?? c.conceptId;
    if (!id) continue;
    byId[id] = { due: 0, fragile: 0, strong: 0, total: 0, lastReview: null };
    termToId[normalizeTag(c.term)] = id;
    termToId[normalizeTag(id)] = id;
  }

  for (const card of cards) {
    const tag = normalizeTag(card.conceptTag ?? card.conceptId);
    const conceptId = termToId[tag];
    if (!conceptId || !byId[conceptId]) continue;
    const entry = byId[conceptId];
    entry.total += 1;
    const health = getCardHealth(card);
    if (health === 'fragile') entry.fragile += 1;
    if (health === 'strong') entry.strong += 1;
    const due = card.fsrsState?.due;
    if (due && due <= Date.now()) entry.due += 1;
    const last = card.fsrsState?.lastReview;
    if (last && (!entry.lastReview || last > entry.lastReview)) {
      entry.lastReview = last;
    }
  }
  return byId;
}

function diagnosticByConcept(journey, moduleId) {
  const summary = parseDiagnosticSummary(journey);
  if (!summary?.conceptPerformance) return {};
  const map = {};
  for (const row of summary.conceptPerformance) {
    if (!row?.conceptId) continue;
    // Diagnostic may be journey-wide; keep all rows and let caller scope by module concepts.
    map[row.conceptId] = row;
  }
  if (moduleId && summary.moduleId && summary.moduleId !== moduleId) {
    // Keep rows; concept IDs are unique enough for matching module concepts.
  }
  return map;
}

function failureModesForConcept(profile, conceptId) {
  if (!profile?.topConcepts) return [];
  return profile.topConcepts
    .filter((c) => c.conceptId === conceptId)
    .map((c) => c.modeId)
    .filter(Boolean);
}

function decideStatus({ quiz, fsrs, diagnostic, failureModes }) {
  const attempts = quiz?.attempts ?? 0;
  const accuracy = attempts > 0 ? Math.round((quiz.correct / attempts) * 100) : null;
  const hasAny = attempts > 0
    || (fsrs?.total ?? 0) > 0
    || (diagnostic?.untimedAttempts ?? 0) > 0
    || failureModes.length > 0;

  if (!hasAny) {
    return { status: STATUS.unseen, confidence: 'low' };
  }

  if ((fsrs?.fragile ?? 0) > 0 || (fsrs?.due ?? 0) > 0 || failureModes.length > 0) {
    return { status: STATUS.fragile, confidence: attempts >= 2 || failureModes.length ? 'medium' : 'low' };
  }

  if (accuracy != null && accuracy < 60 && attempts >= 2) {
    return { status: STATUS.fragile, confidence: 'medium' };
  }

  if (accuracy != null && accuracy >= 80 && attempts >= 2 && (fsrs?.fragile ?? 0) === 0) {
    return { status: STATUS.solid, confidence: 'medium' };
  }

  if ((diagnostic?.untimedAttempts ?? 0) > 0) {
    const diagAcc = diagnostic.untimedAttempts
      ? Math.round((diagnostic.untimedCorrect / diagnostic.untimedAttempts) * 100)
      : null;
    if (diagAcc != null && diagAcc < 50) {
      return { status: STATUS.fragile, confidence: 'low' };
    }
  }

  return { status: STATUS.developing, confidence: 'low' };
}

/**
 * Deterministic concept status board rows for a module.
 * @param {{ module: object, journey?: object|null, sessions?: object[], cards?: object[] }} params
 */
export function buildConceptStatusBoard({
  module,
  journey = null,
  sessions = [],
  cards = [],
} = {}) {
  const concepts = module?.knowledgeMap?.concepts ?? [];
  if (!concepts.length) return [];

  const quizMap = quizStatsByConcept(sessions, module.moduleId);
  const fsrsMap = fsrsByConcept(
    (cards ?? []).filter((c) => !module.moduleId || c.moduleId === module.moduleId || c.journeyId === module.journeyId),
    concepts,
  );
  const diagnosticMap = diagnosticByConcept(journey, module.moduleId);
  const profile = computeFailureProfile(module);

  return concepts.map((concept) => {
    const conceptId = concept.id ?? concept.conceptId;
    const quiz = quizMap[conceptId] ?? null;
    const fsrs = fsrsMap[conceptId] ?? null;
    const diagnostic = diagnosticMap[conceptId] ?? null;
    const failureModes = failureModesForConcept(profile, conceptId);
    const decided = decideStatus({ quiz, fsrs, diagnostic, failureModes });
    const attempts = quiz?.attempts ?? 0;
    const accuracy = attempts > 0 ? Math.round((quiz.correct / attempts) * 100) : null;

    return {
      conceptId,
      term: conceptLabel(concept),
      definition: concept.definition ?? '',
      status: decided.status,
      confidence: decided.confidence,
      accuracy,
      attempts,
      dueCards: fsrs?.due ?? 0,
      fragileCards: fsrs?.fragile ?? 0,
      failureModes,
      lastPracticedAt: quiz?.lastAt ?? fsrs?.lastReview ?? null,
      moduleId: module.moduleId,
      journeyId: module.journeyId,
      recommendedActivityType: decided.status === 'fragile' || decided.status === 'developing'
        ? 'practiceQuiz'
        : decided.status === 'solid'
          ? 'flashcardSet'
          : 'learningGuide',
    };
  });
}

export const CONCEPT_STATUS = STATUS;
