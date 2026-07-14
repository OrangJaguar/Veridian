import { describe, it, expect } from 'vitest';
import {
  getPrescriptionForMode,
  getPrescriptionSummary,
  allMatrixCellsFilled,
  getFullPrescriptionMatrix,
} from '@/utils/failures/prescriptionMatrix';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

describe('prescriptionMatrix', () => {
  it('fills every failure mode × stage cell', () => {
    expect(allMatrixCellsFilled()).toBe(true);
  });

  it.each(FAILURE_MODE_IDS)('returns valid spec for mode %s at each stage', (modeId) => {
    for (const stage of ['A', 'B', 'C']) {
      const spec = getPrescriptionForMode(modeId, stage);
      expect(spec).toBeTruthy();
      expect(spec.prescriptionType).toBeTruthy();
      expect(spec.activityType).toBeTruthy();
      expect(getPrescriptionSummary(spec)).toBeTruthy();
    }
  });

  it('defaults unknown stage to B', () => {
    const spec = getPrescriptionForMode('understanding_gap', 'Z');
    const bSpec = getPrescriptionForMode('understanding_gap', 'B');
    expect(spec).toEqual(bSpec);
  });

  it('exports full matrix with all modes', () => {
    const matrix = getFullPrescriptionMatrix();
    for (const modeId of FAILURE_MODE_IDS) {
      expect(matrix[modeId]).toBeDefined();
      expect(matrix[modeId].A).toBeDefined();
      expect(matrix[modeId].B).toBeDefined();
      expect(matrix[modeId].C).toBeDefined();
    }
  });
});
