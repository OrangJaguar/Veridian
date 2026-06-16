/**
 * Journey-wide activities unlock when at least half of modules reach Stage B or C.
 */
export function journeyWideActivitiesUnlocked(modules = []) {
  const total = modules.length;
  if (total === 0) return false;
  const ready = modules.filter((m) => m.stage === 'B' || m.stage === 'C').length;
  return ready >= Math.ceil(total / 2);
}

export function journeyUnlockProgress(modules = []) {
  const total = modules.length;
  const ready = modules.filter((m) => m.stage === 'B' || m.stage === 'C').length;
  const required = total === 0 ? 0 : Math.ceil(total / 2);
  return { ready, required, total };
}

/** Modules eligible for cram selection (Stage B or C). */
export function cramEligibleModules(modules = []) {
  return modules.filter((m) => m.stage === 'B' || m.stage === 'C');
}
