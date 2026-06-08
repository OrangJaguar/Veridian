import { create } from 'zustand';
import { buildCachedKnowledgeMap } from '@/api/ai/regenerateModules';

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
    });
  },

  setProposal: (proposal) => set({
    proposal,
    cachedKnowledgeMap: buildCachedKnowledgeMap(proposal),
  }),

  updateProposal: (patch) => set((s) => {
    const proposal = { ...s.proposal, ...patch };
    return {
      proposal,
      cachedKnowledgeMap: proposal ? buildCachedKnowledgeMap(proposal) : null,
    };
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
    if (isProcessing) return false;
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
}));
