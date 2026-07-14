import { extractEvidenceFromDiagnostic } from '@/utils/failures/extractEvidenceFromDiagnostic';

function isTimedQuiz(session) {
  return session.activityType === 'practiceQuiz' && (
    session.sessionData?.config?.timedMode === true
    || session.sessionData?.quizConfig?.strictMode === true
    || session.sessionData?.quizConfig?.strictTimedMode === true
  );
}

function getNeighborConceptIds(conceptId, knowledgeMap) {
  const concepts = knowledgeMap?.concepts ?? [];
  const idx = concepts.findIndex((c) => c.id === conceptId || c.conceptId === conceptId);
  if (idx < 0) return [];
  const neighbors = [];
  if (idx > 0) neighbors.push(concepts[idx - 1].id ?? concepts[idx - 1].conceptId);
  if (idx < concepts.length - 1) neighbors.push(concepts[idx + 1].id ?? concepts[idx + 1].conceptId);
  return neighbors.filter(Boolean);
}

function variantMissModes(variantType, correct, questionType) {
  if (correct) return [];
  if (questionType === 'matching') return ['interference'];
  if (questionType === 'ordering') return ['understanding_gap'];
  if (questionType === 'shortAnswer') return ['understanding_gap'];
  if (variantType === 'verbatim') return ['verbatim_trap'];
  if (variantType === 'application' || variantType === 'transfer') return ['transfer_failure'];
  return ['understanding_gap'];
}

function extractQuizEvidence(session, module, now) {
  const questions = session.sessionData?.questions ?? [];
  const answers = session.sessionData?.answers ?? [];
  const answerById = Object.fromEntries(answers.map((a) => [a.questionId, a]));
  const timed = isTimedQuiz(session);
  const conceptHits = [];
  const moduleHits = [];
  const recentMissConcepts = [];

  const existingEvidence = module?.failureEvidence
    ? (typeof module.failureEvidence === 'string'
      ? JSON.parse(module.failureEvidence)
      : module.failureEvidence)
    : null;

  for (const q of questions) {
    const ans = answerById[q.id];
    if (!ans || ans.skipped) continue;
    const conceptId = q.conceptId ?? ans.conceptId;
    if (!conceptId) continue;

    const sample = {
      sessionId: session.sessionId,
      activityType: session.activityType,
      at: now,
      note: timed ? 'timed-quiz' : 'quiz',
    };

    if (!ans.correct) {
      recentMissConcepts.push(conceptId);
      const modes = q.variantType || q.type !== 'multipleChoice'
        ? variantMissModes(q.variantType, false, q.type)
        : variantMissModes(q.variantType, false, q.type);

      for (const modeId of modes) {
        conceptHits.push({ conceptId, modeId, weight: 1, sample });
      }

      // Interference: miss on concept after missing neighbor
      const neighbors = getNeighborConceptIds(conceptId, module?.knowledgeMap);
      const prevMiss = recentMissConcepts[recentMissConcepts.length - 2];
      if (prevMiss && neighbors.includes(prevMiss)) {
        conceptHits.push({
          conceptId,
          modeId: 'interference',
          weight: 1,
          sample: { ...sample, note: 'interference-pattern' },
        });
      }
    } else if (timed && existingEvidence?.concepts?.[conceptId]) {
      const untimedHits = existingEvidence.concepts[conceptId]?.modes?.understanding_gap?.hits
        ?? existingEvidence.concepts[conceptId]?.modes?.transfer_failure?.hits
        ?? 0;
      if (untimedHits > 0) {
        conceptHits.push({
          conceptId,
          modeId: 'pressure_collapse',
          weight: 1,
          sample: { ...sample, note: 'timed-correct-after-untimed-misses' },
        });
      }
    }
  }

  if (timed && answers.some((a) => !a.correct)) {
    moduleHits.push({
      modeId: 'pressure_collapse',
      weight: 1,
      sample: {
        sessionId: session.sessionId,
        activityType: session.activityType,
        at: now,
        note: 'timed-quiz-misses',
      },
    });
  }

  return { conceptHits, moduleHits, sessionId: session.sessionId };
}

function extractFlashcardEvidence(session, cards, now) {
  const reviews = session.sessionData?.reviews ?? [];
  const cardById = Object.fromEntries((cards ?? []).map((c) => [c.cardId, c]));
  const againByConcept = {};

  const conceptHits = [];
  for (const review of reviews) {
    const card = cardById[review.cardId];
    const conceptId = card?.conceptId ?? card?.conceptTag;
    if (!conceptId) continue;

    const sample = {
      sessionId: session.sessionId,
      activityType: 'flashcardSet',
      at: now,
      note: `rating-${review.rating}`,
    };

    if (review.rating === 'again') {
      againByConcept[conceptId] = (againByConcept[conceptId] ?? 0) + 1;
      conceptHits.push({
        conceptId,
        modeId: 'retention_decay',
        weight: 1,
        sample,
      });
    }
  }

  for (const [conceptId, count] of Object.entries(againByConcept)) {
    if (count >= 3) {
      conceptHits.push({
        conceptId,
        modeId: 'verbatim_trap',
        weight: 1,
        sample: {
          sessionId: session.sessionId,
          activityType: 'flashcardSet',
          at: now,
          note: 'repeated-again-cues',
        },
      });
    }
  }

  return { conceptHits, moduleHits: [], sessionId: session.sessionId };
}

function extractGuideEvidence(session, module, now) {
  const checkIns = session.sessionData?.checkInResults ?? [];
  const conceptHits = [];
  const concepts = module?.knowledgeMap?.concepts ?? [];

  for (const check of checkIns) {
    if (check.correct === false) {
      const conceptId = concepts[0]?.id ?? concepts[0]?.conceptId ?? 'module-general';
      conceptHits.push({
        conceptId,
        modeId: 'understanding_gap',
        weight: 1,
        sample: {
          sessionId: session.sessionId,
          activityType: 'learningGuide',
          at: now,
          note: `checkin-${check.sectionId ?? 'section'}`,
        },
      });
    }
  }

  return { conceptHits, moduleHits: [], sessionId: session.sessionId };
}

function extractFeynmanEvidence(session, now) {
  const threads = session.sessionData?.conceptThreads ?? {};
  const conceptHits = [];

  for (const [conceptId, thread] of Object.entries(threads)) {
    const confidence = thread?.summary?.confidencePercent;
    if (confidence == null) continue;
    const sample = {
      sessionId: session.sessionId,
      activityType: 'feynman',
      at: now,
      note: `confidence-${confidence}`,
    };
    if (confidence < 40) {
      conceptHits.push({ conceptId, modeId: 'understanding_gap', weight: 2, sample });
    } else if (confidence < 60) {
      conceptHits.push({ conceptId, modeId: 'understanding_gap', weight: 1, sample });
    }
  }

  return { conceptHits, moduleHits: [], sessionId: session.sessionId };
}

function extractFreeRecallEvidence(session, now) {
  const coverage = session.sessionData?.conceptCoverage
    ?? session.outcomeSummary?.conceptCoverage
    ?? [];
  const conceptHits = [];
  const hintsUsed = session.sessionData?.hintsUsed ?? 0;

  if (Array.isArray(coverage) && coverage.length) {
    for (const entry of coverage) {
      const conceptId = entry.conceptId ?? entry.term;
      if (!conceptId) continue;
      const sample = {
        sessionId: session.sessionId,
        activityType: 'freeRecall',
        at: now,
        note: entry.status,
      };
      if (entry.status === 'missed' || entry.status === 'incorrect') {
        conceptHits.push({ conceptId, modeId: 'understanding_gap', weight: 1, sample });
      } else if (entry.status === 'partial' && hintsUsed > 0) {
        conceptHits.push({ conceptId, modeId: 'verbatim_trap', weight: 1, sample });
      }
    }
    return { conceptHits, moduleHits: [], sessionId: session.sessionId };
  }

  const missed = session.sessionData?.missedIdeas ?? [];
  for (const idea of missed.slice(0, 5)) {
    conceptHits.push({
      conceptId: String(idea),
      modeId: 'understanding_gap',
      weight: 1,
      sample: {
        sessionId: session.sessionId,
        activityType: 'freeRecall',
        at: now,
        note: 'missed-idea',
      },
    });
  }

  return { conceptHits, moduleHits: [], sessionId: session.sessionId };
}

/**
 * Extract evidence deltas from a completed study session.
 */
export function extractEvidenceFromSession(session, activity, module, cards = []) {
  const now = session.endedAt ?? Date.now();
  const activityType = session.activityType ?? activity?.type;

  if (activityType === 'baselineCheck') {
    const placement = session.sessionData?.placement;
    if (placement && module?.moduleId) {
      return extractEvidenceFromDiagnostic({
        placement,
        moduleId: module.moduleId,
        sessionId: session.sessionId,
        activityType,
      });
    }
    return { conceptHits: [], moduleHits: [], sessionId: session.sessionId };
  }

  if (activityType === 'practiceQuiz' || activityType === 'cramSession' || activityType === 'journeyChallenge') {
    return extractQuizEvidence(session, module, now);
  }

  if (activityType === 'flashcardSet') {
    return extractFlashcardEvidence(session, cards, now);
  }

  if (activityType === 'learningGuide') {
    return extractGuideEvidence(session, module, now);
  }

  if (activityType === 'feynman') {
    return extractFeynmanEvidence(session, now);
  }

  if (activityType === 'freeRecall') {
    return extractFreeRecallEvidence(session, now);
  }

  return { conceptHits: [], moduleHits: [], sessionId: session.sessionId };
}
