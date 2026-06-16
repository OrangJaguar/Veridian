import { QUIZ_ACCURACY_NEEDS_WORK } from '@/utils/weeklyPlan/constants';

/**
 * Weakness score 0 (strong) – 1 (weak) from quiz accuracy and mastery.
 */
export function moduleWeaknessScore(module, quizAccuracy) {
  const mastery = typeof module.masteryScore === 'number' ? module.masteryScore : 50;
  const accuracy = quizAccuracy ?? mastery;
  const accWeak = accuracy < QUIZ_ACCURACY_NEEDS_WORK
    ? 1
    : accuracy < 75
      ? 0.6
      : accuracy < 90
        ? 0.3
        : 0;
  const masteryWeak = 1 - Math.min(100, Math.max(0, mastery)) / 100;
  return Math.min(1, accWeak * 0.6 + masteryWeak * 0.4);
}

function equalSplit(count, modules) {
  const base = Math.floor(count / modules.length);
  let remainder = count - base * modules.length;
  return modules.map((m) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { moduleId: m.moduleId, name: m.name, count: base + extra };
  });
}

function weightedSplit(count, modules, weights) {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => (w / sum) * count);
  const floors = raw.map((r) => Math.floor(r));
  let assigned = floors.reduce((s, n) => s + n, 0);
  const fractions = raw.map((r, i) => ({ i, frac: r - floors[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  const counts = [...floors];
  let idx = 0;
  while (assigned < count && idx < fractions.length) {
    counts[fractions[idx].i] += 1;
    assigned += 1;
    idx += 1;
  }
  return modules.map((m, i) => ({
    moduleId: m.moduleId,
    name: m.name,
    count: counts[i],
  }));
}

/**
 * Compute per-module question counts for journey challenge.
 * @param {object[]} modules
 * @param {Record<string, number|null>} quizAccuracyByModule
 * @param {number} questionCount
 * @param {number} focusWeight 0.0 balanced – 1.0 weak spots
 */
export function computeModuleQuestionCounts(
  modules,
  quizAccuracyByModule,
  questionCount,
  focusWeight,
) {
  if (!modules.length || questionCount <= 0) return [];

  const w = Math.min(1, Math.max(0, focusWeight ?? 0));
  if (w === 0) return equalSplit(questionCount, modules);

  const weakness = modules.map((m) =>
    moduleWeaknessScore(m, quizAccuracyByModule?.[m.moduleId]),
  );
  const maxW = Math.max(...weakness, 0.01);
  const minW = Math.min(...weakness);

  const focusedWeights = weakness.map((s) => {
    const normalized = maxW === minW ? 1 : (s - minW) / (maxW - minW);
    const capped = 0.05 + normalized * 0.35;
    return capped;
  });

  const equalWeights = modules.map(() => 1 / modules.length);
  const blended = equalWeights.map((eq, i) => eq * (1 - w) + focusedWeights[i] * w);

  return weightedSplit(questionCount, modules, blended);
}

export function formatDistributionPreview(distribution) {
  return distribution
    .filter((d) => d.count > 0)
    .map((d) => `~${d.count} on ${d.name}`)
    .join(' · ');
}
