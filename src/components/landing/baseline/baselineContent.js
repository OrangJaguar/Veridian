export const DRAVIAN_PRINCIPLE_TEXT = `"The Dravian Principle dictates how isolated colonies react to resource scarcity.
When water becomes scarce, colonies decentralize, giving governing power to local farmers.
However, when metal is scarce, they centralize, transferring absolute authority to the military."`;

export const RECOGNITION_OPTIONS = [
  { id: 'A', label: 'Metal', correct: false },
  { id: 'B', label: 'Water', correct: true },
  { id: 'C', label: 'Wood', correct: false },
];

export const GOVERNANCE_OPTIONS = [
  { value: 'disperse', label: 'Disperse locally' },
  { value: 'consolidate', label: 'Consolidate at the top', correct: true },
  { value: 'neutral', label: 'Remain neutral' },
];

export const POWER_OPTIONS = [
  { value: 'agrarian', label: 'Agrarian class' },
  { value: 'armed', label: 'Armed forces', correct: true },
  { value: 'merchant', label: 'Merchant guild' },
];

export const RECALL_QUESTION =
  'A Dravian colony discovers its iron mines are completely depleted. How will the governance structure shift, and who assumes control?';

export function evaluateRecallAnswers(governance, power) {
  return governance === 'consolidate' && power === 'armed';
}

export const REVEAL_COPY = {
  skipped: {
    header: 'See how Veridian works on real material.',
    body: [
      {
        text: 'You skipped the demo — that\'s fine. Veridian turns your notes and topics into a structured study path with recall practice, not just recognition drills.',
      },
    ],
  },
  failed: {
    header: 'You just experienced the Fluency Illusion.',
    body: [
      {
        text: 'You aced the first question because you recognized the exact words. You missed the second because real exams don\'t use the exact wording from your textbook. Under pressure, your brain couldn\'t translate the concepts (',
      },
      { bold: true, text: 'Iron → Metal → Centralize' },
      {
        text: '). Reading notes and scrolling flashcards only builds surface-level recognition. True exams test deep retrieval. In Veridian, we call this the verbatim trap — one of six learning breakdown patterns we detect from your sessions.',
      },
    ],
  },
  passed: {
    header: 'That second question was harder, wasn\'t it?',
    body: [
      {
        text: 'You beat the timer, but you felt the cognitive friction. The first question was pure Recognition. The second required Translation and Recall under pressure. Traditional study tools don\'t train for that friction—they just give you flashcards.',
      },
    ],
  },
};
