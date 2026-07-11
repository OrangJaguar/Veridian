import { generateLearningGuide } from '@/api/ai/study';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';

/**
 * Generate a full learning guide in a single AI call.
 * (Name kept from the old section-by-section flow for import compatibility.)
 */
export async function generateLearningGuideProgressive(basePayload, { signal } = {}) {
  const raw = await generateLearningGuide(basePayload, { signal });
  const sections = raw.sections ?? [];
  if (!sections.length) {
    throw new Error(
      raw.parsedSkipped
        ? 'Guide returned raw dump only (disable raw dump mode: veridianAiDebug.rawOff()).'
        : 'AI returned an empty learning guide. Try again.',
    );
  }
  return normalizeGuideContent({
    sections,
    estimatedMinutes: raw.estimatedMinutes ?? Math.max(8, sections.length * 5),
  });
}
