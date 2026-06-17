import {
  BookOpen,
  Layers,
  MessageCircle,
  Brain,
  Timer,
  Trophy,
  PenLine,
} from 'lucide-react';

export const ACTIVITY_TOOLTIPS = {
  learningGuide: {
    icon: BookOpen,
    title: 'Learning Guide',
    body: 'An AI-generated lesson broken into readable sections with worked examples and check-in questions. Open it to read at your pace, then launch a study session when you are ready to practice.',
  },
  flashcardSet: {
    icon: Layers,
    title: 'Flashcards',
    body: 'A spaced-repetition deck for this module. Edit cards on the deck page, then study them in short sessions — cards you struggle with come back sooner.',
  },
  practiceQuiz: {
    icon: PenLine,
    title: 'Practice Quiz',
    body: 'AI-generated multiple-choice questions based on your module concepts. Choose how many questions to attempt, then get instant feedback and explanations.',
  },
  cramSession: {
    icon: Timer,
    title: 'Cram Session',
    body: 'A fast, time-boxed review across your weakest modules — ideal before an exam. Unlocks when half your modules reach Stage B.',
  },
  journeyChallenge: {
    icon: Trophy,
    title: 'Journey Challenge',
    body: 'A strict, timed exam-style run covering your whole journey. Tests everything you have studied so far under realistic pressure.',
  },
  feynman: {
    icon: MessageCircle,
    title: 'Feynman Technique',
    body: 'Explain concepts back to an AI tutor in plain language. It asks follow-up questions until your understanding is solid — a mastery-stage activity.',
  },
  freeRecall: {
    icon: Brain,
    title: 'Free Recall',
    body: 'Write what you remember without hints, then get AI grading and targeted feedback. Optional hints are available if you get stuck.',
  },
};

export function getActivityTooltip(type) {
  return ACTIVITY_TOOLTIPS[type] ?? null;
}
