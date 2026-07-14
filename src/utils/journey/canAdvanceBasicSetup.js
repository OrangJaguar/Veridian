import { JOURNEY_SUBJECT_OPTIONS } from '@/lib/journeySubjects';
import { isValidJourneyTitle } from '@/utils/schemas/journeyTitle';

/** Validation for Step 1 create — open journeys may omit examDate. */
export function canAdvanceBasicSetup(draft, { hasExamDate } = {}) {
  const titleOk = isValidJourneyTitle(draft?.title);
  const subjectOk = JOURNEY_SUBJECT_OPTIONS.includes(draft?.subject);
  if (!titleOk || !subjectOk) return false;
  if (hasExamDate) return draft?.examDate != null;
  return true;
}
