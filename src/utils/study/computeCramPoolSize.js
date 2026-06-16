const SEC_PER_QUESTION = 90;
const MIN_POOL = 5;
const MAX_POOL = 40;

export function computeCramPoolSize(durationMin) {
  const min = Math.max(1, Number(durationMin) || 15);
  const raw = Math.ceil((min * 60) / SEC_PER_QUESTION);
  return Math.min(MAX_POOL, Math.max(MIN_POOL, raw));
}
