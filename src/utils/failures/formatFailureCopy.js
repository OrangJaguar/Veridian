import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { getPrescriptionSummary } from '@/utils/failures/prescriptionMatrix';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';

export function formatProfileHeadline(profile) {
  if (!profile?.hasData || !profile.primaryMode) {
    return 'Your learning profile will appear after a few study sessions.';
  }
  const meta = getFailureModeMeta(profile.primaryMode);
  return meta?.studentExplanation ?? meta?.summary ?? '';
}

export function formatEvidenceCount(sessionCount) {
  if (!sessionCount) return '';
  return `Based on ${sessionCount} session${sessionCount === 1 ? '' : 's'}`;
}

export function formatTrendBadge(trend) {
  switch (trend) {
    case 'improving': return 'Improving';
    case 'worsening': return 'Needs practice';
    case 'stable': return 'Stable';
    default: return null;
  }
}

export function formatJourneyChipText({ moduleCount, modeTitle }) {
  return `${moduleCount} module${moduleCount === 1 ? '' : 's'} · ${modeTitle}`;
}

export function formatConfidenceBadge(confidence) {
  if (confidence === 'confirmed') return 'Clear pattern';
  if (confidence === 'emerging') return 'Early signal';
  return null;
}

export function formatRankedBarLabel(modeId) {
  const meta = getFailureModeMeta(modeId);
  return meta?.title ?? modeId;
}

export function formatSecondaryModeLine(profile) {
  if (!profile?.secondaryMode || profile.secondaryMode === profile.primaryMode) {
    return null;
  }
  const meta = getFailureModeMeta(profile.secondaryMode);
  if (!meta) return null;
  return `Also watching for ${meta.title.toLowerCase()}`;
}

export function formatPrescriptionPreview(prescription) {
  if (!prescription?.shouldApply || !prescription?.summary) return null;
  const activityLabel = prescription.spec?.activityType
    ? (ACTIVITY_LABELS[prescription.spec.activityType] ?? prescription.spec.activityType)
    : null;
  if (activityLabel) {
    return `${prescription.summary} · ${activityLabel}`;
  }
  return prescription.summary;
}

export function formatJourneyEmptyState({ modulesWithEvidence = 0, totalModules = 0 } = {}) {
  if (totalModules === 0) {
    return 'Add modules and study a few sessions — patterns will appear here.';
  }
  if (modulesWithEvidence === 0) {
    return `Study a few sessions across your ${totalModules} module${totalModules === 1 ? '' : 's'} — Veridian will map how learning breaks down.`;
  }
  return null;
}

export function formatExamProximity(daysToExam) {
  if (daysToExam == null || daysToExam < 0) return null;
  if (daysToExam === 0) return 'Exam is today';
  if (daysToExam === 1) return '1 day to exam';
  return `${daysToExam} days to exam`;
}

export function formatSessionInsight(profile) {
  if (!profile?.hasData || !profile.primaryMode) return null;
  const meta = getFailureModeMeta(profile.primaryMode);
  if (!meta) return null;
  return `We're seeing a ${meta.title} signal — tonight's practice will target it.`;
}

export function formatJourneyDiagnosticSummary({ modulesWithEvidence = 0, totalModules = 0, topConcernTitle = null } = {}) {
  const parts = [];
  if (totalModules > 0) {
    parts.push(`${modulesWithEvidence} of ${totalModules} modules with patterns`);
  }
  if (topConcernTitle) {
    parts.push(`top concern: ${topConcernTitle}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

export function formatEmptyStateTier({ evidenceSessionCount = 0, hasEmerging = false }) {
  if (evidenceSessionCount === 0) {
    return {
      tier: 'empty',
      title: 'No patterns yet',
      body: 'Study a few sessions — Veridian will map how learning breaks down for you.',
    };
  }
  if (!hasEmerging) {
    return {
      tier: 'warming',
      title: 'Patterns forming',
      body: 'Keep studying — this is an early signal, not a verdict. A bit more practice helps lock in a primary pattern.',
    };
  }
  return null;
}

export function formatPrescriptionSummaryFromSpec(spec) {
  return getPrescriptionSummary(spec);
}

/** Soft toast when a module first reaches emerging confidence. */
export function formatFirstEmergingToast(modeId) {
  const meta = getFailureModeMeta(modeId);
  const title = meta?.title ?? 'a learning pattern';
  return {
    title: `Early signal: ${title}`,
    description: 'Home Focus will prioritize practice for this.',
  };
}
