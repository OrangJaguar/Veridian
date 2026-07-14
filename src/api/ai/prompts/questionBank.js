/**
 * AI prompt helpers for admin question bank generation (Plan 2).
 */

export const QUESTION_BANK_SYSTEM = `You generate durable practice questions for Veridian certified question banks.

Rules:
- Output ONLY valid JSON. No markdown.
- Generate EXACTLY the requested count — one question per slot when compositionSlots provided.
- Every question MUST include conceptId from the concepts list.
- Supported types: multipleChoice, trueFalse, shortAnswer, multiSelect, ordering, matching.
- Include variantType and mixCategory when specified in slots.
- multipleChoice: exactly 4 options; correctAnswer must match an option verbatim.
- NEVER write meta or chatty stems.
- ordering: provide items array and correctAnswer as ordered array of item strings.
- matching: leftItems, rightItems, correctAnswer as { leftTerm: rightDefinition } map.
- Explanations: 1–2 sentences each.`;

export function buildQuestionBankUserPrompt({
  moduleName,
  concepts = [],
  compositionSlots = [],
  count = 10,
}) {
  return JSON.stringify({
    task: 'generateQuestionBankSlice',
    moduleName,
    concepts,
    questionCount: count,
    compositionSlots,
    outputSchema: {
      questions: [{
        id: 'string',
        type: 'multipleChoice | trueFalse | shortAnswer | multiSelect | ordering | matching',
        stem: 'string',
        options: ['optional'],
        items: ['ordering only'],
        leftItems: ['matching only'],
        rightItems: ['matching only'],
        correctAnswer: 'string | string[] | object',
        explanation: 'string',
        conceptId: 'string',
        variantType: 'optional',
        mixCategory: 'optional',
      }],
    },
  });
}
