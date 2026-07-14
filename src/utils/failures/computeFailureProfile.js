import {
  EMERGING_EVIDENCE_HITS,
  CONFIRMED_EVIDENCE_HITS,
  RECENCY_BOOST_DAYS,
  RECENCY_WEIGHT,
  FAILURE_MODE_IDS,
} from '@/utils/failures/constants';
import { parseModuleFailureEvidence } from '@/utils/failures/evidenceSchema';

function resolveConceptLabel(conceptId, knowledgeMap) {
  const concepts = knowledgeMap?.concepts ?? [];
  const match = concepts.find((c) => c.id === conceptId || c.conceptId === conceptId);
  return match?.term ?? match?.label ?? match?.name ?? conceptId;
}

function confidenceFromHits(hits) {
  if (hits >= CONFIRMED_EVIDENCE_HITS) return 'confirmed';
  if (hits >= EMERGING_EVIDENCE_HITS) return 'emerging';
  return null;
}

function recencyMultiplier(lastAt, now) {
  if (!lastAt) return 1;
  const days = (now - lastAt) / 86400000;
  return days <= RECENCY_BOOST_DAYS ? RECENCY_WEIGHT : 1;
}

function collectModeScores(evidence, now) {
  const scores = Object.fromEntries(FAILURE_MODE_IDS.map((id) => [id, { score: 0, rawHits: 0, conceptIds: new Set() }]));

  for (const concept of Object.values(evidence.concepts ?? {})) {
    for (const [modeId, modeData] of Object.entries(concept.modes ?? {})) {
      if (!scores[modeId]) continue;
      const mult = recencyMultiplier(modeData.lastAt, now);
      scores[modeId].score += (modeData.hits ?? 0) * mult;
      scores[modeId].rawHits += modeData.hits ?? 0;
      scores[modeId].conceptIds.add(concept.conceptId);
    }
  }

  for (const [modeId, modeData] of Object.entries(evidence.moduleLevel ?? {})) {
    if (!scores[modeId]) continue;
    const mult = recencyMultiplier(modeData.lastAt, now);
    scores[modeId].score += (modeData.hits ?? 0) * mult;
    scores[modeId].rawHits += modeData.hits ?? 0;
  }

  return scores;
}

function computeTrend(evidence, now) {
  const weekMs = 7 * 86400000;
  let recent = 0;
  let prior = 0;

  const countSamples = (from, to) => {
    let n = 0;
    for (const concept of Object.values(evidence.concepts ?? {})) {
      for (const modeData of Object.values(concept.modes ?? {})) {
        for (const s of modeData.samples ?? []) {
          if (s.at >= from && s.at < to) n += 1;
        }
      }
    }
    return n;
  };

  recent = countSamples(now - weekMs, now);
  prior = countSamples(now - 2 * weekMs, now - weekMs);

  if (recent === 0 && prior === 0) return 'unknown';
  if (recent < prior) return 'improving';
  if (recent > prior * 1.2) return 'worsening';
  return 'stable';
}

/**
 * Compute user-facing failure profile from module.failureEvidence.
 */
export function computeFailureProfile(module, now = Date.now()) {
  const evidence = parseModuleFailureEvidence(module?.failureEvidence);
  const sessionCount = evidence.processedSessionIds?.length ?? 0;
  const hasConceptOrModuleData = Object.keys(evidence.concepts ?? {}).length > 0
    || Object.keys(evidence.moduleLevel ?? {}).length > 0;

  if (!hasConceptOrModuleData && sessionCount === 0) {
    return {
      primaryMode: null,
      secondaryMode: null,
      rankedModes: [],
      topConcepts: [],
      evidenceSessionCount: 0,
      lastUpdatedAt: null,
      hasData: false,
      trend: 'unknown',
      primaryConfidence: null,
    };
  }

  const modeScores = collectModeScores(evidence, now);
  const rankedModes = FAILURE_MODE_IDS
    .map((modeId) => {
      const { score, rawHits, conceptIds } = modeScores[modeId];
      const confidence = confidenceFromHits(rawHits);
      return {
        modeId,
        score,
        rawHits,
        confidence: confidence ?? 'emerging',
        conceptCount: conceptIds.size,
      };
    })
    .filter((m) => m.rawHits > 0)
    .sort((a, b) => b.score - a.score);

  const emergingOrBetter = rankedModes.filter(
    (m) => m.rawHits >= EMERGING_EVIDENCE_HITS,
  );

  const primary = emergingOrBetter[0] ?? null;
  const secondary = emergingOrBetter[1] ?? null;

  const topConcepts = [];
  for (const concept of Object.values(evidence.concepts ?? {})) {
    let bestMode = null;
    let bestHits = 0;
    for (const [modeId, modeData] of Object.entries(concept.modes ?? {})) {
      if ((modeData.hits ?? 0) > bestHits) {
        bestHits = modeData.hits ?? 0;
        bestMode = modeId;
      }
    }
    if (bestMode && bestHits >= EMERGING_EVIDENCE_HITS) {
      topConcepts.push({
        conceptId: concept.conceptId,
        label: resolveConceptLabel(concept.conceptId, module?.knowledgeMap),
        modeId: bestMode,
        hits: bestHits,
        confidence: confidenceFromHits(bestHits) ?? 'emerging',
      });
    }
  }

  topConcepts.sort((a, b) => b.hits - a.hits);

  return {
    primaryMode: primary?.modeId ?? null,
    secondaryMode: secondary?.modeId ?? null,
    rankedModes: emergingOrBetter,
    topConcepts: topConcepts.slice(0, 3),
    evidenceSessionCount: sessionCount,
    lastUpdatedAt: evidence.updatedAt ?? null,
    hasData: emergingOrBetter.length > 0,
    trend: computeTrend(evidence, now),
    primaryConfidence: primary ? confidenceFromHits(primary.rawHits) : null,
  };
}
