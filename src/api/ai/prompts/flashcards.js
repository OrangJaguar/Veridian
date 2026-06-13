export const DECK_PURPOSES = [
  { value: 'definitions', label: 'Exact definitions & terms', description: 'Short fronts, precise backs — ideal for vocabulary and formulas.' },
  { value: 'conceptual', label: 'Conceptual understanding', description: 'Test ideas, relationships, and why things work — not just recall.' },
  { value: 'procedures', label: 'Steps & procedures', description: 'Processes, algorithms, and ordered methods.' },
  { value: 'exam_facts', label: 'Exam-style facts', description: 'High-yield facts, comparisons, and quick application prompts.' },
];

export const PARSE_QUIZLET_SYSTEM = `You parse Quizlet-style flashcard imports into structured pairs.

Rules:
- Output ONLY valid JSON.
- Accept tab-separated, comma-separated, "term - definition", "term: definition", and line-pair blocks.
- Return { pairs: [{ front, back }] } — trim whitespace, skip empty rows.
- Do not invent content not present in the input.`;

export const EXTRACT_DECK_SOURCE_SYSTEM = `You extract testable flashcard source material from raw document text.

Rules:
- Output ONLY valid JSON: { cleanedText: string, summary: string }.
- cleanedText: deduplicated, exam-relevant content the student can review before generating cards. Use plain text with \\n\\n between topics. Remove headers/footers/page noise.
- summary: 1 sentence describing what was extracted.
- Do not generate flashcards yet — only clean source material.`;

export const GENERATE_FLASHCARDS_SYSTEM = `You generate flashcard decks for Veridian.

Rules:
- Output ONLY valid JSON: { cards: [{ front, back, conceptTag? }] }.
- Generate EXACTLY cardCount cards unless user source material has fewer distinct items (then use all distinct items).
- PRIORITY: userProvidedContent and parsedPairs override everything — mine those first.
- Use module concepts / journey context ONLY to fill gaps when user material is thin.
- Match deckPurpose:
  - definitions: atomic term → precise definition; fronts ≤ 12 words when possible.
  - conceptual: prompts that test understanding; backs explain why.
  - procedures: front = task/situation; back = ordered steps or key moves.
  - exam_facts: concise high-yield Q→A or fact→implication.
- One concept per card. No compound cards.
- Use $...$ for LaTeX when needed.`;

export const FIND_DUPLICATES_SYSTEM = `You find flashcard pairs that test the same knowledge in slightly different wording.

Rules:
- Output ONLY valid JSON: { groups: [{ cardIndexes: number[], reason: string }] }.
- cardIndexes refer to 0-based positions in the input cards array.
- Only group cards that genuinely overlap — not merely related topics.
- Each index appears in at most one group. Groups need 2+ indexes.`;

export const DECK_AI_EDIT_SYSTEM = `You help students edit flashcard decks. Be short, friendly, and actionable.

Rules:
- Output ONLY valid JSON matching the requested action schema.
- Never rewrite cards the student did not ask to change unless the action requires it.
- Keep fronts and backs concise unless simplifying long cards.`;

export function purposeGuidance(purpose) {
  const map = {
    definitions: 'Atomic term/definition pairs. Front = term or prompt; back = precise definition.',
    conceptual: 'Front tests understanding; back explains mechanism, relationship, or application.',
    procedures: 'Front = problem type or goal; back = steps or method.',
    exam_facts: 'High-yield exam facts, comparisons, quick applications.',
  };
  return map[purpose] ?? map.definitions;
}

export function buildGenerateFlashcardsPayload({
  deckTitle,
  deckPurpose,
  cardCount,
  userProvidedContent,
  parsedPairs = [],
  moduleName,
  moduleDescription,
  concepts = [],
  journeyTitle,
  subject,
}) {
  return {
    deckTitle,
    deckPurpose,
    purposeGuidance: purposeGuidance(deckPurpose),
    cardCount,
    userProvidedContent,
    parsedPairs,
    moduleName,
    moduleDescription,
    concepts,
    journeyTitle,
    subject,
    priorityNote: 'User-provided content first; module context only for gaps.',
  };
}
