/** Common subject options for journey creation. */
export const JOURNEY_SUBJECT_OPTIONS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Computer Science',
  'Psychology',
  'History',
  'English',
  'Economics',
  'Business',
  'Nursing',
  'Pre-Med',
  'MCAT Prep',
  'Engineering',
  'Foreign Language',
  'Other',
];

export function isValidJourneySubject(subject) {
  return JOURNEY_SUBJECT_OPTIONS.includes(String(subject ?? '').trim());
}
