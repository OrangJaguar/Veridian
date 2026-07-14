import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { pickPrescriptionAssignment } from '@/utils/planner/pickPrescriptionAssignment';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';

const FOCUS_STALE_MS = 48 * 60 * 60 * 1000;

/**
 * Find highest-priority module with a confirmed failure profile not studied recently.
 */
export function getProfileFocusModule({
  journey,
  modules = [],
  activities = [],
  sessions = [],
  now = Date.now(),
}) {
  const candidates = [];

  for (const mod of modules) {
    const profile = computeFailureProfile(mod, now);
    if (!profile.hasData || profile.primaryConfidence !== 'confirmed' || !profile.primaryMode) {
      continue;
    }

    const moduleSessions = sessions.filter(
      (s) => s.moduleId === mod.moduleId && s.status === 'completed',
    );
    const lastStudied = moduleSessions.reduce(
      (max, s) => Math.max(max, s.endedAt ?? s.startedAt ?? 0),
      0,
    );
    if (lastStudied && now - lastStudied < FOCUS_STALE_MS) continue;

    const ctx = buildModuleContext(mod, activities, sessions, journey);
    const pick = pickPrescriptionAssignment(ctx);
    if (!pick?.activity) continue;

    candidates.push({
      module: mod,
      profile,
      pick,
      lastStudied,
      priority: (profile.trend === 'worsening' ? 0 : 1) - (lastStudied / 1e15),
    });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0] ?? null;
}
