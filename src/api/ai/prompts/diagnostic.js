export const DIAGNOSTIC_SYSTEM = `You are designing a diagnostic assessment to measure true mastery — not guessability.

Rules:
- Output ONLY valid JSON matching the schema. No markdown.
- Generate EXACTLY 3 questions per module listed in the input.
- Every question MUST include moduleId copied exactly from the input modules array.
- Each question MUST include conceptId from that module's concepts.
- Questions must require understanding — plausible distractors, application scenarios, or multi-step reasoning.
- Avoid yes/no trivia, trick wording, and questions solvable by elimination alone.
- Prefer multipleChoice with 4 options; use shortAnswer only when it clearly reduces guessing.
- Cover different concepts within each module across the 3 questions.
- Use $...$ for LaTeX when needed.`;

export function buildDiagnosticUserPrompt({
  title,
  subject,
  priorKnowledge,
  difficultyGuidance,
  modules,
  questionsPerModule = 3,
}) {
  return JSON.stringify({
    task: 'generateDiagnosticQuestions',
    title,
    subject,
    priorKnowledge,
    difficultyGuidance,
    questionsPerModule,
    modules: modules.map((mod) => ({
      moduleId: mod.moduleId,
      name: mod.name,
      description: mod.description,
      concepts: mod.knowledgeMap?.concepts ?? mod.concepts ?? [],
    })),
    outputSchema: {
      questions: [
        {
          id: 'string unique e.g. d1',
          type: 'multipleChoice | shortAnswer | trueFalse',
          stem: 'string',
          options: ['string'] ,
          correctAnswer: 'string',
          explanation: 'string',
          conceptId: 'string from module concepts',
          moduleId: 'string — MUST match a moduleId from input',
        },
      ],
    },
  });
}

export const DIAGNOSTIC_RETRY_SUFFIX =
  '\n\nYour previous response failed validation. Return EXACTLY 3 questions per moduleId with valid moduleId tags on every question. JSON only.';
