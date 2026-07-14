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
    body: 'Short timed sprint on weak modules — prep, not a full mock exam. Unlocks when half your modules reach Stage B. Distinct from Exam week packing on your study plan.',
  },
  journeyChallenge: {
    icon: Trophy,
    title: 'Journey Challenge',
    body: 'Timed exam-style check across the journey. Measures readiness under realistic pressure — assessment, not a weak-module sprint.',
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
