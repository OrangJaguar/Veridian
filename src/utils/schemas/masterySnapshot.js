import { z } from 'zod';

export const snapshotDaySchema = z.union([z.literal(7), z.literal(30), z.literal(60)]);

export const masterySnapshotSchema = z.object({
  snapshotId: z.string(),
  userEmail: z.string().optional(),
  moduleId: z.string(),
  journeyId: z.string(),
  snapshotDay: snapshotDaySchema,
  masteryScore: z.number().min(0).max(100),
  sessionCount: z.number().int().min(0),
  totalStudyMinutes: z.number().min(0),
  isActiveAtSnapshot: z.boolean(),
  daysLate: z.number().int().min(0),
  capturedAt: z.number(),
});

export const createMasterySnapshotSchema = masterySnapshotSchema.omit({ userEmail: true });
