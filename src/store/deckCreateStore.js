import { create } from 'zustand';
import {
  generateFlashcards,
  parseQuizletImport,
  extractDeckSource,
} from '@/api/ai/study';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { extractAiList, coerceStudyAiPayload } from '@/utils/study/normalizeStudyAiResponse';
import { buildGenerateFlashcardsPayload } from '@/api/ai/prompts/flashcards';
import { parseQuizletFormat } from '@/utils/study/parseQuizletFormat';
import { createFlashcardDeck } from '@/api/entities/journeyScaffold';
import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';

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
  isProcessing: false,
  processingError: null,

  init: ({ journeyId, moduleId, context }) => set({
    journeyId,
    moduleId,
    context,
    step: 1,
    draft: { ...initialDraft },
    generatedCards: [],
    isProcessing: false,
    processingError: null,
  }),

  resetWizard: () => set({
    step: 1,
    draft: { ...initialDraft },
    generatedCards: [],
    isProcessing: false,
    processingError: null,
  }),

  setStep: (step) => set({ step }),
  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

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

      const cardCount = Number(payload.cardCount ?? 20);

      const cards = await runStudyAiGeneration({
        generate: async () => {
          // Single call for the full deck — the AI model handles large card counts
          // reliably (batching was a legacy output-limit workaround).
          const result = await invokeWithRetry(
            (signal) => generateFlashcards(payload, { signal }),
          );
          const coerced = coerceStudyAiPayload('generateFlashcards', result);
          const cardsList = extractAiList(coerced, 'cards').map((c, i) => ({
            id: `draft-${i}`,
            front: c.front,
            back: c.back,
            conceptTag: c.conceptTag,
          }));
          return cardsList.slice(0, cardCount);
        },
        normalize: (list) => list,
        validate: (list) => {
          if (!list.length) throw new Error('No cards were generated.');
        },
      });

      set({
        generatedCards: cards,
        isProcessing: false,
      });
      return true;
    } catch (err) {
      set({ isProcessing: false, processingError: err.message || 'Generation failed' });
      return false;
    }
  },

  finalizeDeck: async () => {
    const { journeyId, moduleId, draft, generatedCards } = get();
    if (!generatedCards.length) throw new Error('No cards to save.');

    return createFlashcardDeck(moduleId, journeyId, {
      title: draft.title.trim(),
      cards: generatedCards.map((c) => ({
        front: c.front,
        back: c.back,
        conceptTag: c.conceptTag,
      })),
    });
  },
}));