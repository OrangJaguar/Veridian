import { describe, it, expect } from 'vitest';
import {
  formatRankedBarLabel,
  formatSecondaryModeLine,
  formatPrescriptionPreview,
  formatJourneyEmptyState,
  formatExamProximity,
  formatSessionInsight,
  formatJourneyDiagnosticSummary,
  formatEmptyStateTier,
  formatConfidenceBadge,
  formatTrendBadge,
  formatFirstEmergingToast,
} from '@/utils/failures/formatFailureCopy';

describe('formatFailureCopy', () => {
  it('formatRankedBarLabel returns taxonomy title', () => {
    expect(formatRankedBarLabel('verbatim_trap')).toBe('Verbatim trap');
  });

  it('formatSecondaryModeLine returns null when no secondary', () => {
    expect(formatSecondaryModeLine({ primaryMode: 'verbatim_trap', secondaryMode: null })).toBeNull();
    expect(formatSecondaryModeLine({ primaryMode: 'verbatim_trap', secondaryMode: 'verbatim_trap' })).toBeNull();
  });

  it('formatSecondaryModeLine uses soft watching-for language', () => {
    const line = formatSecondaryModeLine({
      primaryMode: 'verbatim_trap',
      secondaryMode: 'transfer_failure',
    });
    expect(line).toContain('Also watching for');
    expect(line).toContain('transfer failure');
  });

  it('formatPrescriptionPreview combines summary and activity', () => {
    const preview = formatPrescriptionPreview({
      shouldApply: true,
      summary: 'Practice applying ideas in new scenarios',
      spec: { activityType: 'practiceQuiz' },
    });
    expect(preview).toContain('Practice applying');
    expect(preview).toContain('Practice Quiz');
  });

  it('formatPrescriptionPreview returns null when not applicable', () => {
    expect(formatPrescriptionPreview({ shouldApply: false })).toBeNull();
  });

  it('formatJourneyEmptyState handles zero and partial evidence', () => {
    expect(formatJourneyEmptyState({ totalModules: 0 })).toContain('Add modules');
    expect(formatJourneyEmptyState({ modulesWithEvidence: 0, totalModules: 3 })).toContain('3 modules');
    expect(formatJourneyEmptyState({ modulesWithEvidence: 2, totalModules: 3 })).toBeNull();
  });

  it('formatExamProximity formats day counts', () => {
    expect(formatExamProximity(null)).toBeNull();
    expect(formatExamProximity(0)).toBe('Exam is today');
    expect(formatExamProximity(1)).toBe('1 day to exam');
    expect(formatExamProximity(14)).toBe('14 days to exam');
  });

  it('formatSessionInsight uses soft signal language', () => {
    const insight = formatSessionInsight({
      hasData: true,
      primaryMode: 'pressure_collapse',
    });
    expect(insight).toContain("We're seeing a Pressure collapse signal");
    expect(insight).toContain("tonight's practice");
    expect(insight).not.toMatch(/failed|detected — practice will adapt/i);
  });

  it('formatSessionInsight returns null without data', () => {
    expect(formatSessionInsight({ hasData: false })).toBeNull();
  });

  it('formatJourneyDiagnosticSummary joins module and concern stats', () => {
    const summary = formatJourneyDiagnosticSummary({
      modulesWithEvidence: 2,
      totalModules: 4,
      topConcernTitle: 'Verbatim trap',
    });
    expect(summary).toContain('2 of 4 modules');
    expect(summary).toContain('Verbatim trap');
  });

  it('formatEmptyStateTier returns soft tiered copy', () => {
    const empty = formatEmptyStateTier({ evidenceSessionCount: 0 });
    expect(empty.tier).toBe('empty');
    expect(empty.body).toContain('breaks down for you');

    const warming = formatEmptyStateTier({ evidenceSessionCount: 2, hasEmerging: false });
    expect(warming.tier).toBe('warming');
    expect(warming.body).toContain('early signal, not a verdict');

    expect(formatEmptyStateTier({ evidenceSessionCount: 2, hasEmerging: true })).toBeNull();
  });

  it('formatConfidenceBadge uses soft labels', () => {
    expect(formatConfidenceBadge('confirmed')).toBe('Clear pattern');
    expect(formatConfidenceBadge('emerging')).toBe('Early signal');
    expect(formatConfidenceBadge(null)).toBeNull();
  });

  it('formatTrendBadge softens worsening', () => {
    expect(formatTrendBadge('worsening')).toBe('Needs practice');
    expect(formatTrendBadge('improving')).toBe('Improving');
    expect(formatTrendBadge('stable')).toBe('Stable');
  });

  it('formatFirstEmergingToast returns soft toast payload', () => {
    const toast = formatFirstEmergingToast('verbatim_trap');
    expect(toast.title).toContain('Early signal');
    expect(toast.title).toContain('Verbatim trap');
    expect(toast.description).toContain('Focus');
  });
});
