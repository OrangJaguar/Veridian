import { create } from 'zustand';
import { proposeJourney } from '@/api/ai/proposeJourney';
import { regenerateModules, buildCachedKnowledgeMap } from '@/api/ai/regenerateModules';

const initialDraft = {
  title: '',
  subject: '',
  examDate: null,
  priorKnowledge: 'some',
  material: '',
  sourceMode: 'upload',
  uploadedFileNames: [],
};

export const useJourneyCreateStore = create((set, get) => ({
  step: 1,
  draft: { ...initialDraft },
  proposal: null,
  cachedKnowledgeMap: null,
  isProcessing: false,
  processingError: null,
  abortController: null,
  hasConfirmedAi: false,
  proposalRunId: 0,

  setStep: (step) => set({ step }),

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  resetWizard: () => {
    const { abortController } = get();
    abortController?.abort();
    set({
      step: 1,
      draft: { ...initialDraft },
      proposal: null,
      cachedKnowledgeMap: null,
      isProcessing: false,
      processingError: null,
      abortController: null,
      hasConfirmedAi: false,
      proposalRunId: 0,
    });
  },

  setProposal: (proposal) => set({
    proposal,
    cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
  }),

  updateModule: (index, patch) => set((s) => {
    if (!s.proposal) return s;
    const modules = [...s.proposal.modules];
    modules[index] = { ...modules[index], ...patch };
    const proposal = { ...s.proposal, modules };
    return {
      proposal,
      cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
    };
  }),

  deleteModule: (index) => set((s) => {
    if (!s.proposal || s.proposal.modules.length <= 2) return s;
    const modules = s.proposal.modules.filter((_, i) => i !== index);
    const proposal = { ...s.proposal, modules };
    return {
      proposal,
      cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
    };
  }),

  addModule: () => set((s) => {
    if (!s.proposal || s.proposal.modules.length >= 8) return s;
    const modules = [
      ...s.proposal.modules,
      {
        name: 'New Module',
        description: 'Add a description',
        concepts: [{ id: 'c1', term: 'Concept', definition: 'Definition' }],
      },
    ];
    const proposal = { ...s.proposal, modules };
    return {
      proposal,
      cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
    };
  }),

  moveModule: (index, direction) => set((s) => {
    if (!s.proposal) return s;
    const target = index + direction;
    if (target < 0 || target >= s.proposal.modules.length) return s;
    const modules = [...s.proposal.modules];
    [modules[index], modules[target]] = [modules[target], modules[index]];
    const proposal = { ...s.proposal, modules };
    return {
      proposal,
      cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
    };
  }),

  beginProcessing: () => {
    const { isProcessing, abortController } = get();
    if (isProcessing) return null;
    abortController?.abort();
    const controller = new AbortController();
    set({
      isProcessing: true,
      processingError: null,
      abortController: controller,
    });
    return controller;
  },

  endProcessing: (error = null) => set({
    isProcessing: false,
    processingError: error,
    abortController: null,
  }),

  setHasConfirmedAi: (v) => set({ hasConfirmedAi: v }),

  /** Single entry point for the propose API — prevents duplicate calls. */
  async runProposal({ onSuccess }) {
    const state = get();
    if (state.isProcessing) return;

    const controller = get().beginProcessing();
    if (!controller) return;

    const runId = state.proposalRunId + 1;
    set({ proposalRunId: runId });

    try {
      const proposal = await proposeJourney({
        title: state.draft.title.trim(),
        subject: state.draft.subject.trim(),
        priorKnowledge: state.draft.priorKnowledge,
        material: state.draft.material,
      }, { signal: controller.signal });

      if (get().proposalRunId !== runId) return;

      get().setProposal(proposal);
      get().endProcessing();
      onSuccess?.();
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (get().proposalRunId !== runId) return;
      get().endProcessing(err.message || 'AI processing failed');
    }
  },

  async runRegenerate() {
    const state = get();
    if (state.isProcessing || !state.cachedKnowledgeMap) return null;

    const controller = get().beginProcessing();
    if (!controller) return null;

    try {
      const next = await regenerateModules({
        title: state.draft.title.trim(),
        subject: state.draft.subject.trim(),
        priorKnowledge: state.draft.priorKnowledge,
        cachedKnowledgeMap: state.cachedKnowledgeMap,
      }, { signal: controller.signal });

      get().setProposal(next);
      get().endProcessing();
      return next;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      get().endProcessing(err.message || 'Regenerate failed');
      throw err;
    }
  },
}));
