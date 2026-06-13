/**
 * Normalize AI learning guide output to match UI expectations.
 */
export function normalizeGuideContent(raw) {
  if (!raw?.sections?.length) return null;

  const sections = raw.sections.map((section, index) => {
    const workedExamples = (section.workedExamples ?? []).slice(0, 1).map((ex) => ({
      scenario: String(ex.scenario ?? '').trim(),
      steps: (ex.steps ?? []).map((s) => String(s).trim()).filter(Boolean),
      answer: String(ex.answer ?? '').trim(),
      reasoning: String(ex.reasoning ?? '').trim(),
    })).filter((ex) => ex.scenario && ex.steps.length);

    const checkIn = section.checkInQuestion ?? {};
    let options = (checkIn.options ?? []).map((o) => String(o).trim()).filter(Boolean);
    if (options.length > 4) options = options.slice(0, 4);
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }

    const suggestions = (section.externalSearchSuggestions ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 2);

    return {
      sectionId: section.sectionId || `section-${index + 1}`,
      title: String(section.title ?? `Section ${index + 1}`).trim(),
      explanation: String(section.explanation ?? '').trim(),
      workedExamples,
      checkInQuestion: {
        question: String(checkIn.question ?? 'What is the main idea of this section?').trim(),
        type: 'multipleChoice',
        options,
        correctAnswer: String(checkIn.correctAnswer ?? options[0]).trim(),
        explanation: String(checkIn.explanation ?? '').trim(),
      },
      externalSearchSuggestions: suggestions.length >= 2
        ? suggestions
        : [
          `${section.title ?? 'topic'} explained for beginners`,
          `${section.title ?? 'topic'} worked examples`,
        ],
      transitionText: index < raw.sections.length - 1
        ? String(section.transitionText ?? '').trim()
        : '',
    };
  });

  return {
    contentVersion: 1,
    sections,
    totalSections: sections.length,
    estimatedMinutes: raw.estimatedMinutes ?? Math.max(8, sections.length * 5),
  };
}
