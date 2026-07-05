export const SIX_FAILURES = [
  {
    id: 'conceptual-gap',
    title: 'Conceptual Gap',
    summary: 'Fundamental misunderstanding of the material.',
    detection: 'Veridian flags concepts where your quiz accuracy stays low across multiple phrasings — not just one missed question.',
  },
  {
    id: 'procedural-breakdown',
    title: 'Procedural Breakdown',
    summary: 'Knowing the concept but messing up the execution steps.',
    detection: 'Step-order errors in practice problems and free-recall sessions surface before exam day.',
  },
  {
    id: 'verbatim-trap',
    title: 'Verbatim Trap',
    summary: 'Memorizing exact phrasing, but failing when synonyms are used.',
    detection: 'Variant triads in quizzes swap wording while testing the same concept — if you miss the synonym form, we drill it.',
  },
  {
    id: 'transfer-failure',
    title: 'Transfer Failure',
    summary: 'Failing to apply a known concept to a novel scenario.',
    detection: 'Novel-context questions in diagnostics and Feynman sessions reveal when you can\'t extend what you "know."',
  },
  {
    id: 'concept-interference',
    title: 'Concept Interference',
    summary: 'Two similar concepts bleeding together in your head.',
    detection: 'Interference drills pair easily confused topics and track which one wins under retrieval pressure.',
  },
  {
    id: 'pressure-collapse',
    title: 'Pressure Collapse',
    summary: 'Knowing it perfectly untimed, but blanking under a ticking clock.',
    detection: 'Timed retrieval sessions measure your pressure delta — accuracy drop under time vs. untimed baseline.',
  },
];
