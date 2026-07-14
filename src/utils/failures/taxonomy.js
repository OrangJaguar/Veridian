import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

/** User-facing metadata per failure mode. */
export const FAILURE_TAXONOMY = {
  understanding_gap: {
    title: 'Understanding gap',
    summary: 'Core ideas are missing or confused.',
    studentExplanation: 'You may recognize terms but struggle to explain how concepts connect or apply.',
    evidenceLabel: 'missed foundations across question types',
    detectionCopy: 'Veridian flags concepts where quiz accuracy stays low across multiple phrasings — not just one missed question.',
    iconKey: 'BookOpen',
  },
  verbatim_trap: {
    title: 'Verbatim trap',
    summary: 'Recognition with familiar wording, weaker when phrasing changes.',
    studentExplanation: 'You do well when questions match how you studied, but miss synonyms or rephrased forms.',
    evidenceLabel: 'surface recall without flexible understanding',
    detectionCopy: 'Variant triads in quizzes swap wording while testing the same concept — if you miss the synonym form, we drill it.',
    iconKey: 'Repeat',
  },
  transfer_failure: {
    title: 'Transfer failure',
    summary: 'Hard to apply known ideas in new scenarios.',
    studentExplanation: 'You recall the basics but struggle when the same concept appears in an unfamiliar context.',
    evidenceLabel: 'low performance on novel scenarios',
    detectionCopy: 'Novel-context questions in diagnostics and Feynman sessions reveal when you can\'t extend what you "know."',
    iconKey: 'Shuffle',
  },
  interference: {
    title: 'Interference',
    summary: 'Similar concepts are bleeding together.',
    studentExplanation: 'You mix up closely related ideas — knowing one triggers confusion with another.',
    evidenceLabel: 'cross-concept confusion patterns',
    detectionCopy: 'Interference drills pair easily confused topics and track which one wins under retrieval pressure.',
    iconKey: 'GitBranch',
  },
  pressure_collapse: {
    title: 'Pressure collapse',
    summary: 'Performance drops under time pressure.',
    studentExplanation: 'You know material untimed but accuracy falls when the clock is on.',
    evidenceLabel: 'timed vs untimed accuracy gap',
    detectionCopy: 'Timed retrieval sessions measure your pressure delta — accuracy drop under time vs. untimed baseline.',
    iconKey: 'Timer',
  },
  retention_decay: {
    title: 'Retention decay',
    summary: 'Previously learned material is slipping.',
    studentExplanation: 'Ideas you had down are coming back as lapses in review or repeat misses.',
    evidenceLabel: 'lapses on previously solid material',
    detectionCopy: 'Spaced review tracks cards you rated "again" and repeat misses on material you previously knew — we surface it before it compounds.',
    iconKey: 'TrendingDown',
  },
};

export function getFailureModeMeta(modeId) {
  return FAILURE_TAXONOMY[modeId] ?? null;
}

export function isValidFailureModeId(modeId) {
  return FAILURE_MODE_IDS.includes(modeId);
}
