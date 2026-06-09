import { create } from 'zustand';

const initialState = {
  sessionId: null,
  journeyId: null,
  moduleId: null,
  activityId: null,
  activityType: null,
  phase: 'setup',
  startedAt: null,
  questionIndex: 0,
  answers: [],
  timerSec: 0,
  isPaused: false,
  isGenerating: false,
  generationError: null,
  sessionData: {},
  showSummary: false,
};

export const useStudySessionStore = create((set, get) => ({
  ...initialState,

  hydrate({ session, activity }) {
    set({
      sessionId: session.sessionId,
      journeyId: session.journeyId,
      moduleId: session.moduleId ?? null,
      activityId: session.activityId,
      activityType: session.activityType,
      startedAt: session.startedAt ?? Date.now(),
      sessionData: session.sessionData ?? {},
      phase: 'active',
      showSummary: false,
    });
  },

  setPhase(phase) {
    set({ phase });
  },

  setGenerating(isGenerating, generationError = null) {
    set({ isGenerating, generationError });
  },

  patchSessionData(patch) {
    set({ sessionData: { ...get().sessionData, ...patch } });
  },

  setQuestionIndex(questionIndex) {
    set({ questionIndex });
  },

  addAnswer(answer) {
    set({ answers: [...get().answers, answer] });
  },

  setAnswers(answers) {
    set({ answers });
  },

  tickTimer() {
    if (!get().isPaused) set({ timerSec: get().timerSec + 1 });
  },

  setPaused(isPaused) {
    set({ isPaused });
  },

  showSessionSummary() {
    set({ showSummary: true, phase: 'summary' });
  },

  reset() {
    set(initialState);
  },
}));
