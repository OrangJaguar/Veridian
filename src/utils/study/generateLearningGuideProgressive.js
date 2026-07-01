import { generateLearningGuide } from '@/api/ai/study';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';
import { getActiveStudyAiTrace } from '@/utils/study/studyAiTrace';
import { runChunkedGeneration } from '@/utils/ai/chunkedGeneration';

async function requestLearningGuideSection(payload, signal) {
  const raw = await generateLearningGuide(payload, { signal });
  const section = raw.section ?? raw.sections?.[0];
  if (!section) {
    throw new Error(
      raw.parsedSkipped
        ? 'Section returned raw dump only (disable raw dump mode: veridianAiDebug.rawOff()).'
        : 'AI returned no content for this section. Try again.',
    );
  }
  return section;
}

/**
 * Generate a learning guide one section per API call (fits server time limits).
 * Supports resuming from partially generated sections saved on the activity.
 */
export async function generateLearningGuideProgressive(basePayload, {
  onSection,
  existingSections = [],
} = {}) {
  const sectionCount = basePayload.sectionCount ?? 3;
  const trace = getActiveStudyAiTrace();

  const sections = await runChunkedGeneration({
    totalChunks: sectionCount,
    existingResults: existingSections,
    tracePrefix: '1b_section',
    trace,
    runChunk: async (index, priorSections, signal) => requestLearningGuideSection({
      ...basePayload,
      sectionOnly: true,
      sectionIndex: index,
      sectionCount,
      previousSectionTitle: priorSections[index - 1]?.title ?? null,
    }, signal),
    mapResult: (section) => section,
    onChunkComplete: (section, index, total, allSections) => {
      onSection?.(section, index, total, allSections);
    },
  });

  return normalizeGuideContent({
    sections,
    estimatedMinutes: Math.max(8, sections.length * 5),
  });
}
