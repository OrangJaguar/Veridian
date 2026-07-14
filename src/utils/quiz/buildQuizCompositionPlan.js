import { maxDistinctTypesForStage } from '@/utils/quiz/questionTypes';
import {
  defaultStageMix,
  expandMixCategoryToSlots,
} from '@/utils/quiz/mapMixCategoryToTypes';

const ORDERING_KEYWORDS = ['step', 'process', 'sequence', 'order', 'phase', 'stage'];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function conceptAffinity(concept, subject = '') {
  const text = `${concept?.term ?? ''} ${concept?.definition ?? ''}`.toLowerCase();
  const subj = String(subject).toLowerCase();
  return {
    ordering: ORDERING_KEYWORDS.some((kw) => text.includes(kw)),
    numeric: /math|science|physics|chemistry|calculus|algebra/.test(subj)
      || /\d|equation|formula/.test(text),
  };
}

function pickConcept(concepts, weakConceptIds, index) {
  if (weakConceptIds?.length) {
    return weakConceptIds[index % weakConceptIds.length];
  }
  const list = concepts ?? [];
  if (!list.length) return undefined;
  const c = list[index % list.length];
  return c.id ?? c.conceptId;
}

function neighborConceptId(concepts, conceptId) {
  const list = concepts ?? [];
  const idx = list.findIndex((c) => (c.id ?? c.conceptId) === conceptId);
  if (idx < 0) return undefined;
  const neighbor = list[idx + 1] ?? list[idx - 1];
  return neighbor ? (neighbor.id ?? neighbor.conceptId) : undefined;
}

function recentTypeUsage(quizRegistry, sessions = []) {
  const usage = {};
  const seen = quizRegistry?.seen ?? [];
  for (const entry of seen.slice(-30)) {
    if (entry.type) usage[entry.type] = (usage[entry.type] ?? 0) + 1;
  }
  for (const session of sessions.slice(0, 5)) {
    for (const q of session.sessionData?.questions ?? []) {
      if (q.type) usage[q.type] = (usage[q.type] ?? 0) + 1;
    }
  }
  return usage;
}

function enforceStageTypeCap(slots, stage) {
  const maxTypes = maxDistinctTypesForStage(stage);
  const typeCounts = {};
  slots.forEach((s) => {
    typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1;
  });
  const typesByCount = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const allowedTypes = new Set(typesByCount.slice(0, maxTypes).map(([t]) => t));
  const fallback = typesByCount[0]?.[0] ?? 'multipleChoice';

  return slots.map((slot) => (
    allowedTypes.has(slot.type) ? slot : { ...slot, type: fallback }
  ));
}

function applyFatigueRules(slots, recentUsage) {
  const lastMatchingHeavy = (recentUsage.matching ?? 0) >= 3;
  if (!lastMatchingHeavy) return slots;
  return slots.map((slot) => (
    slot.type === 'matching' && slot.mixCategory !== 'discrimination'
      ? { ...slot, type: 'multipleChoice' }
      : slot
  ));
}

function injectTopicSlots(slots, { concepts, subject, stage, weakConceptIds }) {
  if (stage === 'A' || (concepts?.length ?? 0) < 2) return slots;

  const eligibleOrdering = concepts.filter((c) => conceptAffinity(c, subject).ordering);
  const maxOrdering = stage === 'C' ? 2 : 1;

  let orderingAdded = 0;
  const result = [...slots];

  if (eligibleOrdering.length && orderingAdded < maxOrdering) {
    const idx = result.findIndex((s) => s.type === 'shortAnswer');
    if (idx >= 0) {
      result[idx] = {
        type: 'ordering',
        mixCategory: 'understanding',
        conceptId: eligibleOrdering[0].id ?? eligibleOrdering[0].conceptId,
      };
      orderingAdded += 1;
    }
  }

  const conceptId = pickConcept(concepts, weakConceptIds, 0);
  const paired = conceptId ? neighborConceptId(concepts, conceptId) : undefined;
  const hasDiscrimination = result.some((s) => s.mixCategory === 'discrimination');
  if (hasDiscrimination && paired && conceptId) {
    return result.map((slot) => (
      slot.type === 'matching'
        ? { ...slot, conceptId, pairedConceptId: paired }
        : slot
    ));
  }

  return result;
}

/**
 * Build a per-session composition plan from prescription, stage, and progress.
 */
export function buildQuizCompositionPlan({
  module,
  failureProfile,
  prescriptionSpec,
  setupConfig = {},
  concepts = [],
  quizRegistry,
  sessions = [],
  journey,
  weakConceptIds = [],
} = {}) {
  const stage = module?.stage ?? 'B';
  const totalCount = Number(setupConfig.questionCount) || 10;
  const shouldApply = Boolean(
    prescriptionSpec?.questionMix
    && failureProfile?.hasData
    && failureProfile?.primaryConfidence,
  );

  let slots = [];

  if (shouldApply) {
    const mixEntries = Object.entries(prescriptionSpec.questionMix);
    let slotIndex = 0;
    const mixTotal = mixEntries.reduce((sum, [, n]) => sum + n, 0) || 1;

    for (const [mixCategory, rawCount] of mixEntries) {
      const scaled = Math.max(1, Math.round((rawCount / mixTotal) * totalCount));
      const conceptId = pickConcept(concepts, weakConceptIds, slotIndex);
      const pairedConceptId = mixCategory === 'discrimination'
        ? neighborConceptId(concepts, conceptId)
        : undefined;

      slots.push(...expandMixCategoryToSlots(mixCategory, scaled, {
        variantType: mixCategory === 'application' ? 'application'
          : mixCategory === 'transfer' ? 'transfer'
            : mixCategory === 'review' ? 'verbatim'
              : undefined,
        conceptId,
        pairedConceptId,
        timedFriendly: prescriptionSpec.timed === true,
      }));
      slotIndex += 1;
    }
  } else {
    const stageMix = defaultStageMix(stage);
    for (const entry of stageMix) {
      const count = Math.max(1, Math.round(totalCount * entry.weight));
      slots.push(...Array.from({ length: count }, (_, i) => ({
        type: entry.type,
        mixCategory: entry.mixCategory,
        variantType: entry.mixCategory === 'transfer' ? 'transfer' : undefined,
        conceptId: pickConcept(concepts, weakConceptIds, i),
      })));
    }
  }

  slots = slots.slice(0, totalCount);
  while (slots.length < totalCount) {
    slots.push({
      type: 'multipleChoice',
      mixCategory: 'understanding',
      conceptId: pickConcept(concepts, weakConceptIds, slots.length),
    });
  }

  const recentUsage = recentTypeUsage(quizRegistry, sessions);
  slots = applyFatigueRules(slots, recentUsage);
  slots = injectTopicSlots(slots, {
    concepts,
    subject: journey?.subject,
    stage,
    weakConceptIds,
  });
  slots = enforceStageTypeCap(slots, stage);

  slots = slots.map((slot, i) => ({
    ...slot,
    conceptId: slot.conceptId ?? pickConcept(concepts, weakConceptIds, i),
  }));

  return {
    totalCount: slots.length,
    prescriptionType: shouldApply ? prescriptionSpec.prescriptionType : null,
    slots,
    uiPresetRecommendation: setupConfig.uiPreset === 'apClassroom' ? 'apClassroom' : 'classic',
    timedDefault: prescriptionSpec?.timed === true || setupConfig.timedMode === true,
  };
}

export function pickConceptIdsForPlan(plan, concepts = []) {
  const ids = plan?.slots?.map((s) => s.conceptId).filter(Boolean) ?? [];
  if (ids.length) return [...new Set(ids)];
  return concepts.map((c) => c.id ?? c.conceptId).filter(Boolean);
}
