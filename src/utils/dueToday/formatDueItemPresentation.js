import { formatReasonCopy } from '@/utils/planner/reasonCopy';

/** Brief why-copy without journey or module names (context line carries those). */
const REASON_BRIEF = {
  guide_not_started: 'Start the learning guide',
  guide_in_progress: 'Continue the learning guide',
  weak_concepts: 'Recent quiz misses — practice quiz',
  struggling_quiz: 'Quiz scores are low',
  scheduled_quiz: 'Scheduled practice quiz',
  flashcard_review: 'Flashcard review',
  fallback_quiz: 'Practice quiz',
  mastery_feynman: 'Explain concepts aloud — Feynman',
  mastery_free_recall: 'Free recall brain dump',
  fallback_spread: 'Catch up',
  min_touch: 'Keep momentum',
  exam_urgency: 'Exam soon — prioritized',
  diagnostic_weakest_signal: 'Diagnostic priority',
  profile_focus: 'Confirmed learning pattern',
  rx_understanding_guide: 'Core concepts — learning guide',
  rx_understanding_quiz: 'Foundational gaps — targeted quiz',
  rx_transfer_drill: 'Transfer fix — new-scenario practice',
  rx_verbatim_variation: 'Wording variation drill',
  rx_verbatim_flashcards: 'Mixed phrasing flashcards',
  rx_interference_discrimination: 'Discrimination practice',
  rx_pressure_timed_drill: 'Timed drill — build exam readiness',
  rx_retention_spaced_review: 'Spaced review — lapsing material',
};

function stripEntityNames(text, { moduleName, journeyTitle } = {}) {
  if (!text) return '';
  let out = String(text);
  if (moduleName) {
    out = out
      .replace(new RegExp(`\\s*[·•]\\s*${escapeRegExp(moduleName)}\\b`, 'gi'), '')
      .replace(new RegExp(`\\s+for\\s+${escapeRegExp(moduleName)}\\b`, 'gi'), '')
      .replace(new RegExp(`\\s+on\\s+${escapeRegExp(moduleName)}\\b`, 'gi'), '')
      .replace(new RegExp(`\\s*—\\s*${escapeRegExp(moduleName)}\\b`, 'gi'), '');
  }
  if (journeyTitle) {
    out = out.replace(new RegExp(`\\s*[·•]\\s*${escapeRegExp(journeyTitle)}\\b`, 'gi'), '');
  }
  return out.replace(/\s{2,}/g, ' ').replace(/\s+[·•]\s*$/, '').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Single presentation model for Focus Now + Due Today rows.
 * @returns {{ activityLabel: string, reasonLine: string, contextLine: string }}
 */
export function formatDueItemPresentation(item = {}) {
  const activityLabel = item.activityLabel ?? item.activityType ?? '';

  let reasonLine = '';
  if (item.prescriptionSummary) {
    reasonLine = item.prescriptionSummary;
  } else if (item.reason && REASON_BRIEF[item.reason]) {
    reasonLine = REASON_BRIEF[item.reason];
  } else if (item.reason) {
    reasonLine = stripEntityNames(
      formatReasonCopy(item.reason, { moduleName: null }),
      { moduleName: 'this module' },
    );
  } else {
    reasonLine = stripEntityNames(item.reasonText || item.actionLabel || '', {
      moduleName: item.moduleName,
      journeyTitle: item.journeyTitle,
    });
  }

  reasonLine = stripEntityNames(reasonLine, {
    moduleName: item.moduleName,
    journeyTitle: item.journeyTitle,
  });

  const journeyOnly = Boolean(
    item.journeyLevel
    || item.isCombinedFsrsDeck
    || item.activityType === 'cramSession'
    || item.activityType === 'journeyChallenge'
    || item.activityType === 'interleavedReview'
    || !item.moduleId,
  );

  const parts = [];
  if (item.journeyTitle) parts.push(item.journeyTitle);
  if (!journeyOnly && item.moduleName) parts.push(item.moduleName);
  const contextLine = parts.join(' · ');

  return { activityLabel, reasonLine, contextLine };
}
