import { MIX_CATEGORIES } from '@/utils/quiz/questionTypes';

/**
 * Map prescription mixCategory counts to concrete question type weights.
 * Returns array of { type, weight } summing to ~1 per category unit.
 */
const CATEGORY_TYPE_WEIGHTS = {
  understanding: [
    { type: 'multipleChoice', weight: 0.55 },
    { type: 'shortAnswer', weight: 0.25 },
    { type: 'trueFalse', weight: 0.20 },
  ],
  application: [
    { type: 'multipleChoice', weight: 0.80 },
    { type: 'trueFalse', weight: 0.20 },
  ],
  transfer: [
    { type: 'multipleChoice', weight: 0.70 },
    { type: 'shortAnswer', weight: 0.30 },
  ],
  discrimination: [
    { type: 'matching', weight: 1.0 },
  ],
  review: [
    { type: 'multipleChoice', weight: 0.60 },
    { type: 'trueFalse', weight: 0.40 },
  ],
};

export function getTypeWeightsForCategory(mixCategory) {
  return CATEGORY_TYPE_WEIGHTS[mixCategory] ?? CATEGORY_TYPE_WEIGHTS.understanding;
}

/**
 * Expand a mixCategory count into typed slot prototypes.
 */
export function expandMixCategoryToSlots(mixCategory, count, {
  variantType,
  conceptId,
  pairedConceptId,
  timedFriendly = false,
} = {}) {
  const weights = getTypeWeightsForCategory(mixCategory);
  const slots = [];
  let assigned = 0;

  weights.forEach((entry, idx) => {
    const isLast = idx === weights.length - 1;
    const slotCount = isLast
      ? count - assigned
      : Math.round(count * entry.weight);
    assigned += slotCount;

    for (let i = 0; i < slotCount; i += 1) {
      slots.push({
        type: entry.type,
        mixCategory,
        variantType: entry.type === 'multipleChoice' ? (variantType ?? mixCategoryToVariant(mixCategory)) : undefined,
        conceptId,
        pairedConceptId: entry.type === 'matching' ? pairedConceptId : undefined,
        timedFriendly,
      });
    }
  });

  return slots.slice(0, count);
}

function mixCategoryToVariant(mixCategory) {
  if (mixCategory === 'application') return 'application';
  if (mixCategory === 'transfer') return 'transfer';
  if (mixCategory === 'review') return 'verbatim';
  return undefined;
}

export function defaultStageMix(stage) {
  if (stage === 'A') {
    return [
      { type: 'multipleChoice', mixCategory: 'understanding', weight: 0.8 },
      { type: 'trueFalse', mixCategory: 'understanding', weight: 0.2 },
    ];
  }
  if (stage === 'C') {
    return [
      { type: 'multipleChoice', mixCategory: 'review', weight: 0.5 },
      { type: 'shortAnswer', mixCategory: 'transfer', weight: 0.25 },
      { type: 'trueFalse', mixCategory: 'review', weight: 0.15 },
      { type: 'ordering', mixCategory: 'understanding', weight: 0.1 },
    ];
  }
  return [
    { type: 'multipleChoice', mixCategory: 'understanding', weight: 0.7 },
    { type: 'trueFalse', mixCategory: 'review', weight: 0.2 },
    { type: 'shortAnswer', mixCategory: 'understanding', weight: 0.1 },
  ];
}

export { MIX_CATEGORIES };
