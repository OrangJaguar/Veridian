export const DECK_SOURCE_MODES = [
  {
    id: 'moduleAuto',
    label: 'Smart module deck',
    description: 'No input needed — AI picks the best terms and definitions from this module and journey.',
  },
  { id: 'quizlet', label: 'Quizlet import', description: 'Paste an existing Quizlet export.' },
  { id: 'pdf', label: 'PDF upload', description: 'Upload a PDF or text file to extract material.' },
  { id: 'notes', label: 'Your notes', description: 'Paste notes or a study guide.' },
];

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
- Generate EXACTLY cardCount cards when enough distinct material exists in the source context.
- Real flashcards only: front = a term, short question, or prompt worth memorizing; back = the direct answer, definition, or explanation.
- NEVER put two unrelated phrases on front/back. The back must answer the front.
- One concept per card. No compound cards, no duplicate fronts.
- Match deckPurpose:
  - definitions: front = vocabulary term, symbol, or named concept; back = precise definition.
  - conceptual: front = "Why/how/what happens when…" question; back = clear explanation.
  - procedures: front = task or problem type; back = ordered steps or method.
  - exam_facts: front = concise exam-style question; back = concise answer.
- If sourceMode is moduleAuto, derive every card from module concepts, module description, journey subject/title, and journey prior knowledge. Do not invent off-topic cards.
- If userProvidedContent or parsedPairs exist, prioritize them first and use module context only to fill gaps.
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
  sourceMode = 'notes',
  userProvidedContent,
  parsedPairs = [],
  moduleName,
  moduleDescription,
  concepts = [],
  journeyTitle,
  subject,
  priorKnowledge,
}) {
  const moduleAuto = sourceMode === 'moduleAuto';
  return {
    deckTitle,
    deckPurpose,
    sourceMode,
    purposeGuidance: purposeGuidance(deckPurpose),
    cardCount,
    userProvidedContent: moduleAuto ? '' : userProvidedContent,
    parsedPairs: moduleAuto ? [] : parsedPairs,
    moduleName,
    moduleDescription,
    concepts,
    journeyTitle,
    subject,
    priorKnowledge,
    priorityNote: moduleAuto
      ? 'No user content — build the full deck from module and journey context only.'
      : 'User-provided content first; module context only for gaps.',
  };
}
