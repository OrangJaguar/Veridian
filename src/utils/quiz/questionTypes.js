/** Canonical quiz interaction types (Plan 2). */
export const QUESTION_TYPES = [
  'multipleChoice',
  'trueFalse',
  'shortAnswer',
  'multiSelect',
  'ordering',
  'matching',
];

export const VARIANT_TYPES = ['verbatim', 'application', 'transfer'];

export const MIX_CATEGORIES = [
  'understanding',
  'application',
  'transfer',
  'discrimination',
  'review',
];

/** UI presets that can render each type. */
export const TYPE_UI_SUPPORT = {
  multipleChoice: { classic: true, apClassroom: true },
  trueFalse: { classic: true, apClassroom: true },
  shortAnswer: { classic: true, apClassroom: false },
  multiSelect: { classic: true, apClassroom: false },
  ordering: { classic: true, apClassroom: false },
  matching: { classic: true, apClassroom: false },
};

export function isQuestionType(value) {
  return QUESTION_TYPES.includes(value);
}

export function supportsApClassroom(type) {
  return TYPE_UI_SUPPORT[type]?.apClassroom === true;
}

export function compositionNeedsClassicRunner(slots = []) {
  return slots.some((slot) => !supportsApClassroom(slot.type));
}

export function maxDistinctTypesForStage(stage) {
  if (stage === 'A') return 2;
  if (stage === 'B') return 3;
  return 4;
}
