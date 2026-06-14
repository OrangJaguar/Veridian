import { generateLearningGuide } from '@/api/ai/study';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';
import { getActiveStudyAiTrace } from '@/utils/study/studyAiTrace';

/**
 * Generate a learning guide one section per API call (fits Base44 ~60s function limit).
 */
export async function generateLearningGuideProgressive(basePayload, { onSection } = {}) {
  const sectionCount = basePayload.sectionCount ?? 3;
  const sections = [];

  for (let i = 0; i < sectionCount; i += 1) {
    const trace = getActiveStudyAiTrace();
    const sectionStart = Date.now();
    trace?.stepStart(`1b_section_${i}`, `Generate section ${i + 1}/${sectionCount}`);

    try {
      const raw = await generateLearningGuide({
        ...basePayload,
        sectionOnly: true,
        sectionIndex: i,
        sectionCount,
        previousSectionTitle: sections[i - 1]?.title ?? null,
      });

      const section = raw.section ?? raw.sections?.[0];
      if (!section) {
        throw new Error(
          raw.parsedSkipped
            ? `Section ${i + 1} returned raw dump only (disable raw dump mode: veridianAiDebug.rawOff()).`
            : `AI returned no content for section ${i + 1}. Try again.`,
        );
      }

      sections.push(section);
      trace?.stepOk(`1b_section_${i}`, `Generate section ${i + 1}/${sectionCount}`, {
        title: section.title,
      }, Date.now() - sectionStart);
      onSection?.(section, i, sectionCount);
    } catch (err) {
      trace?.stepFail(`1b_section_${i}`, `Generate section ${i + 1}/${sectionCount}`, err, null, Date.now() - sectionStart);
      throw err;
    }
  }

  return normalizeGuideContent({
    sections,
    estimatedMinutes: Math.max(8, sections.length * 5),
  });
}
