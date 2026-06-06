import { z } from 'zod';

export const notificationPrefSchema = z.enum(['daily', 'urgent', 'off']);
export const defaultPrivacySchema = z.enum(['private', 'public']);

export const preferencesSchema = z.object({
  userEmail: z.string().optional(),
  themeDark: z.boolean().optional(),
  haptics: z.boolean().optional(),
  audio: z.boolean().optional(),
  strictMode: z.boolean().optional(),
  displayName: z.string().optional(),
  username: z.string().optional(),
  hintsShown: z.array(z.string()).optional(),
  notificationPref: notificationPrefSchema.optional(),
  defaultPrivacy: defaultPrivacySchema.optional(),
  defaultShowSources: z.boolean().optional(),
});

export const updatePreferencesSchema = preferencesSchema.partial();
