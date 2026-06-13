import { create } from 'zustand';
import {
  generateFlashcards,
  parseQuizletImport,
  extractDeckSource,
  findFlashcardDuplicates,
} from '@/api/ai/study';
import { buildGenerateFlashcardsPayload } from '@/api/ai/prompts/flashcards';
import { parseQuizletFormat } from '@/utils/study/parseQuizletFormat';
import {
  findDuplicateGroupsClient,
  mergeAiDuplicateGroups,
} from '@/utils/study/duplicateCards';
import { createFlashcardDeck } from '@/api/entities/journeyScaffold';

const initialDraft = {
  title: '',
  purpose: 'definitions',
  cardCount: 20,
  sourceMode: 'notes',
  rawContent: '',
  extractedPreview: '',
  extractedSummary: '',
  parsedPairs: [],
};

export const useDeckCreateStore = create((set, get) => ({
  step: 1,
  journeyId: null,
  moduleId: null,
  context: null,
  draft: { ...initialDraft },
  generatedCards: [],
  duplicateGroups: [],
  duplicateSelections: {},
  isProcessing: false,
  processingError: null,

  init: ({ journeyId, moduleId, context }) => set({
    journeyId,
    moduleId,
    context,
    step: 1,
    draft: { ...initialDraft },
    generatedCards: [],
    duplicateGroups: [],
    duplicateSelections: {},
    isProcessing: false,
    processingError: null,
  }),

  resetWizard: () => set({
    step: 1,
    draft: { ...initialDraft },
    generatedCards: [],
    duplicateGroups: [],
    duplicateSelections: {},
    isProcessing: false,
    processingError: null,
  }),

  setStep: (step) => set({ step }),
  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  setDuplicateSelection: (groupKey, keepIndex) => set((s) => ({
    duplicateSelections: { ...s.duplicateSelections, [groupKey]: keepIndex },
  })),

  runExtractPreview: async () => {
    const { draft } = get();
    set({ isProcessing: true, processingError: null });
    try {
      const result = await extractDeckSource({ rawText: draft.rawContent });
      set((s) => ({
        draft: {
          ...s.draft,
          extractedPreview: result.cleanedText ?? draft.rawContent,
          extractedSummary: result.summary ?? '',
        },
        isProcessing: false,
      }));
      return true;
    } catch (err) {
      set({
        isProcessing: false,
        processingError: err.message || 'Extraction failed',
        draft: { ...get().draft, extractedPreview: draft.rawContent },
      });
      return true;
    }
  },

  runGenerate: async () => {
    const { draft, context } = get();
    set({ isProcessing: true, processingError: null });

    try {
      let parsedPairs = draft.parsedPairs;
      if (draft.sourceMode === 'quizlet' && draft.rawContent.trim()) {
        try {
          const parsed = await parseQuizletImport({ raw: draft.rawContent });
          parsedPairs = parsed.pairs ?? [];
        } catch {
          parsedPairs = parseQuizletFormat(draft.rawContent);
        }
        set((s) => ({ draft: { ...s.draft, parsedPairs } }));
      }

      const userContent = draft.sourceMode === 'pdf'
        ? draft.extractedPreview
        : draft.sourceMode === 'quizlet'
          ? ''
          : draft.rawContent;

      const payload = buildGenerateFlashcardsPayload({
        deckTitle: draft.title,
        deckPurpose: draft.purpose,
        cardCount: draft.cardCount,
        userProvidedContent: userContent,
        parsedPairs,
        moduleName: context?.moduleName,
        moduleDescription: context?.moduleDescription,
        concepts: context?.concepts ?? [],
        journeyTitle: context?.journeyTitle,
        subject: context?.subject,
      });

      const result = await generateFlashcards(payload);
      const cards = (result.cards ?? []).map((c, i) => ({
        id: `draft-${i}`,
        front: c.front,
        back: c.back,
        conceptTag: c.conceptTag,
      }));

      if (!cards.length) throw new Error('No cards were generated.');

      let groups = [];
      try {
        const dup = await findFlashcardDuplicates({ cards });
        groups = mergeAiDuplicateGroups(dup.groups);
      } catch {
        groups = findDuplicateGroupsClient(cards);
      }

      if (!groups.length) groups = findDuplicateGroupsClient(cards);

      const duplicateGroups = groups.map((g, i) => ({
        ...g,
        id: `dup-${i}-${g.cardIndexes.join('-')}`,
      }));

      const duplicateSelections = {};
      for (const g of duplicateGroups) {
        duplicateSelections[g.id] = g.cardIndexes[0];
      }

      set({
        generatedCards: cards,
        duplicateGroups,
        duplicateSelections,
        isProcessing: false,
      });
      return true;
    } catch (err) {
      set({ isProcessing: false, processingError: err.message || 'Generation failed' });
      return false;
    }
  },

  getResolvedCards: () => {
    const { generatedCards, duplicateGroups, duplicateSelections } = get();
    const drop = new Set();
    for (const group of duplicateGroups) {
      const keep = duplicateSelections[group.id] ?? group.cardIndexes[0];
      for (const idx of group.cardIndexes) {
        if (idx !== keep) drop.add(idx);
      }
    }
    return generatedCards.filter((_, i) => !drop.has(i));
  },

  finalizeDeck: async () => {
    const { journeyId, moduleId, draft, getResolvedCards } = get();
    const cards = getResolvedCards();
    if (!cards.length) throw new Error('No cards to save.');

    return createFlashcardDeck(moduleId, journeyId, {
      title: draft.title.trim(),
      cards: cards.map((c) => ({
        front: c.front,
        back: c.back,
        conceptTag: c.conceptTag,
      })),
    });
  },
}));
