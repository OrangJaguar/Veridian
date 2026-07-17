/**
 * Public FAQ content. Keep wording clear and free of em dashes.
 * Veridian remains free forever with fair-use AI limits.
 */
export const FAQ_ITEMS = [
  {
    id: 'free-forever',
    question: 'Is Veridian free forever?',
    answer:
      'Yes. Veridian is free forever for students. There is no pricing page, no paid tier, and no credit card required to study.',
  },
  {
    id: 'ai-fair-use',
    question: 'Why are there fair-use limits on AI generation?',
    answer:
      'AI generation costs real compute. Fair-use limits keep Veridian sustainable for everyone while still covering normal journey creation and study material refresh. Limits reset on a schedule and are not a paywall.',
  },
  {
    id: 'credit-card',
    question: 'Is a credit card required?',
    answer:
      'No. You can sign up and study without entering a payment method.',
  },
  {
    id: 'journeys-due-today',
    question: 'What are Journeys and Due Today?',
    answer:
      'A Journey is your structured path for a subject or exam: modules, activities, and a weekly plan. Due Today is the focused list of what to study now across your journeys, including planned work and spaced card reviews.',
  },
  {
    id: 'weekly-plan',
    question: 'How does the weekly plan change after studying?',
    answer:
      'After you complete sessions, Veridian updates mastery, evidence, and due reviews. When evidence shifts enough, the weekly plan can rebuild so the next days reflect what you still need, not yesterday\'s guess.',
  },
  {
    id: 'source-material',
    question: 'What files and source material are supported?',
    answer:
      'You can paste text, add links, and upload common study files such as PDFs, Word documents, PowerPoint decks, and images for OCR. Supported formats may grow, but text-rich sources work best.',
  },
  {
    id: 'study-modes',
    question: 'How do quizzes, flashcards, free recall, and spaced repetition work together?',
    answer:
      'Guides and quizzes build understanding. Flashcards with spaced repetition keep details available over time. Free recall asks you to reconstruct ideas without prompts. Together they cover learning, practice, and long-term retention.',
  },
  {
    id: 'ai-accuracy',
    question: 'Can AI-generated learning material be wrong?',
    answer:
      'Yes. Treat AI output as a draft study aid. Check it against your syllabus, textbook, or teacher when something looks off, and report problems so we can improve generation quality.',
  },
  {
    id: 'share-clone',
    question: 'Can journeys be shared or cloned?',
    answer:
      'Public library journeys can be previewed and started when available. Your personal journeys stay private unless you choose a sharing path Veridian supports. Cloning copies structure for your own study, not other students\' private work.',
  },
  {
    id: 'data-stored',
    question: 'What data is stored?',
    answer:
      'We store account details, journeys, study sessions, preferences, and related progress needed to run the product. Optional research consent is separate and never required to study. See the Privacy Policy for the full list.',
  },
  {
    id: 'export-delete',
    question: 'Can users export or delete their data?',
    answer:
      'You can request data export or account deletion through Feedback or the contact paths listed in the Privacy Policy. We process these requests according to that policy.',
  },
  {
    id: 'missed-day',
    question: 'What happens after missing a planned study day?',
    answer:
      'Missing a day is not punished. Due Today and the weekly plan adjust around what is still useful. You can skip, snooze, or recover remaining work without losing pins you set on purpose.',
  },
  {
    id: 'devices',
    question: 'Which devices and browsers are supported?',
    answer:
      'Veridian works in modern desktop and mobile browsers such as current Chrome, Safari, Firefox, and Edge. A stable internet connection is required for sync and AI generation.',
  },
  {
    id: 'report-problem',
    question: 'How can users report a problem?',
    answer:
      'Use the Feedback page in the app footer, or email the contact listed in Privacy Policy. Include what you were doing, what you expected, and any error text if you saw one.',
  },
];

export function buildFaqJsonLd(items = FAQ_ITEMS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
