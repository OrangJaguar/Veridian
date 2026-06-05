// Mutable global state singleton used by the imperative engine (runVeridianApp)
export const S = {
  prefs: {
    themeDark: true,
    haptics: true,
    audio: true,
    strictMode: false,
  },

  decks: [],
  activeDeckId: null,
  telemetry: {
    timeEngagedSec: 0,
    globalCorrect: 0,
    globalAnswered: 0,
    cardsFlipped: 0,
    daily: {},
  },
  telemetryTodayBaseline: {
    timeEngagedSec: 0,
    correctAnswered: 0,
    questionsAnswered: 0,
    cardsFlipped: 0,
  },

  // Session state (quiz / flashcard / typing)
  state: {
    mode: null,
    isAnswered: false,
    isPaused: false,
    isHidden: false,
    timeSeconds: 0,
    totalTimeSeconds: 0,
    timerInterval: null,
    questionStartTime: 0,
    currentIndex: 0,
    activeQuestions: [],
    answersData: [],
    quizSkippedIndices: [],

    fcBaseCards: [],
    fcQueue: [],
    fcTotalInitial: 0,
    fcIsFlipped: false,
    fcCardStartTs: 0,

    typingQueue: [],
    typingDeferredQueue: [],
    typingIndex: 0,
    typingAnswered: false,
    typingStartTs: 0,
    typingPromptStartTs: 0,

    masteryTimingByCard: {},
    masterySessionSeconds: 0,
    masteryCopyText: '',
  },
};
