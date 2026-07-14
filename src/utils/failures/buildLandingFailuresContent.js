import { FAILURE_MODE_IDS } from '@/utils/failures/constants';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';

/**
 * Build landing Six Failures grid content from canonical taxonomy.
 * Single source of truth — do not hand-edit sixFailuresContent.js.
 */
export function buildLandingFailuresContent() {
  return FAILURE_MODE_IDS.map((id) => {
    const meta = getFailureModeMeta(id);
    return {
      id,
      title: meta?.title ?? id,
      summary: meta?.summary ?? '',
      detection: meta?.detectionCopy ?? '',
    };
  });
}
