import { coerceStudyAiPayload } from '@/utils/study/normalizeStudyAiResponse';

/**
 * Normalize AI learning guide output to match UI expectations.
 */
export function normalizeGuideContent(raw) {
  const coerced = coerceStudyAiPayload('generateLearningGuide', raw);
  if (!coerced?.sections?.length) return null;

  const sections = coerced.sections.map((section, index) => {
    let workedExamples = (section.workedExamples ?? []).slice(0, 1).map((ex) => ({
      scenario: String(ex.scenario ?? ex.prompt ?? ex.question ?? '').trim(),
      steps: (ex.steps ?? ex.step ?? []).map((s) => String(s).trim()).filter(Boolean),
      answer: String(ex.answer ?? ex.solution ?? '').trim(),
      reasoning: String(ex.reasoning ?? ex.rationale ?? ex.explanation ?? '').trim(),
    }));

    if (!workedExamples.length || !workedExamples[0].scenario || !workedExamples[0].steps.length) {
      workedExamples = [{
        scenario: `Apply the main ideas from "${section.title ?? `Section ${index + 1}`}".`,
        steps: ['Identify the key concept.', 'Apply it to the scenario.', 'State the conclusion.'],
        answer: 'A clear conclusion based on the section concepts.',
        reasoning: 'Walking through a simple example helps lock in the core idea.',
      }];
    }

    const checkIn = section.checkInQuestion ?? {};
    let options = (checkIn.options ?? []).map((o) => String(o).trim()).filter(Boolean);
    if (options.length > 4) options = options.slice(0, 4);
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }

    const keyTerms = (section.keyTerms ?? [])
      .map((item) => ({
        term: String(item?.term ?? '').trim(),
        definition: String(item?.definition ?? '').trim(),
      }))
      .filter((item) => item.term && item.definition)
      .slice(0, 5);

    const takeaways = (section.takeaways ?? [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 4);

    return {
      sectionId: section.sectionId || `section-${index + 1}`,
      title: String(section.title ?? section.name ?? `Section ${index + 1}`).trim(),
      explanation: String(section.explanation ?? section.content ?? section.body ?? section.summary ?? '').trim()
        || 'Review the module concepts for this section.',
      workedExamples,
      checkInQuestion: {
        question: String(checkIn.question ?? checkIn.stem ?? checkIn.prompt ?? 'What is the main idea of this section?').trim(),
        type: 'multipleChoice',
        options,
        correctAnswer: String(checkIn.correctAnswer ?? checkIn.answer ?? options[0]).trim(),
        explanation: String(checkIn.explanation ?? checkIn.rationale ?? '').trim(),
      },
      keyTerms,
      takeaways,
    };
  });

  return {
    contentVersion: 1,
    sections,
    totalSections: sections.length,
    estimatedMinutes: coerced.estimatedMinutes ?? Math.max(8, sections.length * 5),
  };
}
