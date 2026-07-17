import { z } from 'zod';
import { accountabilityPreferencesSchema, WEEKDAY_KEYS } from '@/utils/schemas/accountability';

export const notificationPrefSchema = z.enum(['weekly', 'urgent', 'off', 'daily']);
export const defaultPrivacySchema = z.enum(['private', 'public']);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9_.]{2,19}$/,
    'Username must be 3–20 characters, start with a letter, and use only letters, numbers, underscores, or periods.',
  );

export const preferencesSchema = z.object({
  userEmail: z.string().optional(),
  username: usernameSchema.optional(),
  displayName: z.string().optional(),
  createdAt: z.number().optional(),
  lastActiveAt: z.number().optional(),
  gradeLevel: z.string().optional(),
  country: z.string().optional(),
  usState: z.string().optional(),
  studyGoals: z.array(z.string()).optional(),
  researchConsent: z.boolean().optional(),
  researchConsentAt: z.number().optional(),
  onboardingCompletedAt: z.number().optional(),
  onboardingStep: z.number().optional(),
  themeDark: z.boolean().optional(),
  haptics: z.boolean().optional(),
  audio: z.boolean().optional(),
  strictMode: z.boolean().optional(),
  hintsShown: z.array(z.string()).optional(),
  notificationPref: notificationPrefSchema.optional(),
  defaultPrivacy: defaultPrivacySchema.optional(),
  defaultShowSources: z.boolean().optional(),
  dailyTimeBudgetMin: z.number().min(10).max(210).optional(),
  studyBudgetTier: z.enum(['light', 'standard', 'intensive']).optional(),
  globalPlanSnapshot: z.record(z.unknown()).optional(),
  globalPlanWeekKey: z.string().optional(),
  globalPlanBuiltAt: z.number().optional(),
  globalPlanMode: z.enum(['normal', 'examWeek', 'cram', 'keepSharp']).optional(),
  usernameChangedAt: z.number().optional(),
  lastReminderEmailAt: z.number().optional(),
  examReminderSentFor: z.array(z.string()).optional(),
  lastEvidencePlanRebuildAt: z.number().optional(),
  maiScoreOnboarding: z.number().min(5).max(25).nullable().optional(),
  maiScoreDay60: z.number().min(5).max(25).nullable().optional(),
  maiSurveyOnboardingCompletedAt: z.number().nullable().optional(),
  maiSurveyDay60CompletedAt: z.number().nullable().optional(),
  maiSurveyDay60DismissedAt: z.number().nullable().optional(),
  hasSeenCreateWelcome: z.boolean().optional(),
  maiSurveyPromptDismissedAt: z.number().nullable().optional(),
}).merge(accountabilityPreferencesSchema);

export const updatePreferencesSchema = preferencesSchema.partial();

export { WEEKDAY_KEYS };

/** Normalize legacy notificationPref values. */
export function normalizeNotificationPref(value) {
  if (value === 'daily') return 'weekly';
  if (value === 'weekly' || value === 'urgent' || value === 'off') return value;
  return 'off';
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidUsernameFormat(value) {
  return usernameSchema.safeParse(normalizeUsername(value)).success;
}
