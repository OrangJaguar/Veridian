import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { daysUntilExam } from '@/utils/weeklyPlan/weekKey';
import { isExamWeekMode, isKeepSharpMode } from '@/utils/planner/pacingMode';

function pacingLabel(mode) {
  if (isExamWeekMode(mode)) return 'Exam week';
  if (isKeepSharpMode(mode)) return 'Keep sharp';
  return 'Normal pacing';
}

function averageMastery(modules = []) {
  const scored = modules.filter((m) => typeof m.masteryScore === 'number');
  if (!scored.length) return null;
  return Math.round(scored.reduce((sum, m) => sum + m.masteryScore, 0) / scored.length);
}

function collectWeakLabels(moduleContexts = []) {
  const labels = [];
  const seen = new Set();
  for (const ctx of moduleContexts) {
    for (const label of ctx.weakConceptLabels ?? []) {
      if (!label || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
      if (labels.length >= 3) return labels;
    }
  }
  return labels;
}

function primaryFailureLabel(modules = []) {
  let best = null;
  for (const module of modules) {
    const profile = computeFailureProfile(module);
    if (!profile?.hasData || !profile.primaryMode) continue;
    const rank = profile.primaryConfidence === 'confirmed' ? 2 : 1;
    if (!best || rank > best.rank) {
      best = {
        rank,
        modeId: profile.primaryMode,
        confidence: profile.primaryConfidence,
        moduleName: module.name,
      };
    }
  }
  if (!best) return null;
  const meta = getFailureModeMeta(best.modeId);
  return {
    label: meta?.title ?? best.modeId,
    detail: best.confidence === 'confirmed'
      ? `Clear pattern on ${best.moduleName ?? 'a module'}`
      : `Early signal on ${best.moduleName ?? 'a module'}`,
  };
}

/**
 * Build deterministic trust factors explaining a weekly plan.
 * Uses only existing planner inputs; never invents unsupported claims.
 */
export function buildPlanTrustFactors({
  journey,
  modules = [],
  moduleContexts = [],
  snapshot,
  mode,
  fsrsDueCount = 0,
} = {}) {
  const factors = [];
  const resolvedMode = mode ?? snapshot?.mode ?? 'normal';
  const budget = snapshot?.dailyBudgetMin;
  const examDays = snapshot?.daysUntilExam ?? daysUntilExam(journey?.examDate);

  factors.push({
    id: 'pacing',
    label: 'Pacing mode',
    value: pacingLabel(resolvedMode),
    detail: examDays != null && examDays >= 0
      ? `${examDays} day${examDays === 1 ? '' : 's'} until exam`
      : 'Based on your exam date setting',
    weight: isExamWeekMode(resolvedMode) ? 'high' : 'medium',
  });

  if (budget != null) {
    factors.push({
      id: 'budget',
      label: 'Daily study budget',
      value: `About ${budget} minutes`,
      detail: 'From your study preferences',
      weight: 'medium',
    });
  }

  const mastery = averageMastery(modules);
  if (mastery != null) {
    factors.push({
      id: 'mastery',
      label: 'Average module mastery',
      value: `${mastery}%`,
      detail: mastery < 55
        ? 'Lower mastery modules are prioritized'
        : 'Stronger modules receive lighter maintenance',
      weight: mastery < 55 ? 'high' : 'low',
    });
  }

  const weak = collectWeakLabels(moduleContexts);
  if (weak.length) {
    factors.push({
      id: 'weak_concepts',
      label: 'Weak concepts',
      value: weak.join(', '),
      detail: 'From recent quiz misses',
      weight: 'high',
    });
  }

  const failure = primaryFailureLabel(modules);
  if (failure) {
    factors.push({
      id: 'failure_profile',
      label: 'Learning pattern',
      value: failure.label,
      detail: failure.detail,
      weight: 'high',
    });
  }

  if (fsrsDueCount > 0) {
    factors.push({
      id: 'fsrs',
      label: 'Cards due for review',
      value: `${fsrsDueCount} card${fsrsDueCount === 1 ? '' : 's'}`,
      detail: 'Spaced repetition schedule',
      weight: 'medium',
    });
  }

  const assignmentCount = (snapshot?.days ?? []).reduce(
    (sum, day) => sum + (day.assignments?.length ?? 0),
    0,
  );
  factors.push({
    id: 'week_load',
    label: 'Planned activities this week',
    value: `${assignmentCount}`,
    detail: assignmentCount === 0
      ? 'Rest days or light review only'
      : 'Packed across available study days',
    weight: 'low',
  });

  return factors;
}
