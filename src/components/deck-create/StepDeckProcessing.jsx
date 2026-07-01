import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { AiFailureCard } from '@/components/study/StudyAiStatus';
import { useDeckCreateStore } from '@/store/deckCreateStore';

export default function StepDeckProcessing({ onRetry, onBack }) {
  const processingError = useDeckCreateStore((s) => s.processingError);
  const isProcessing = useDeckCreateStore((s) => s.isProcessing);
  const generatedCards = useDeckCreateStore((s) => s.generatedCards);
  const targetCount = useDeckCreateStore((s) => s.draft?.cardCount ?? 0);

  if (processingError) {
    const saved = generatedCards?.length ?? 0;
    return (
      <div className="create-step create-step-processing">
        <AiFailureCard
          variant="deck"
          title="Couldn't finish building your deck"
          message={processingError}
          progress={saved > 0 && targetCount > 0
            ? { completed: saved, total: targetCount, label: 'cards' }
            : null}
          onRetry={onRetry}
          onExit={onBack}
          retryLabel="Continue generating"
          exitLabel="Back"
        />
      </div>
    );
  }

  return (
    <div className="create-step create-step-processing">
      <AiGenerationLoading
        action={isProcessing ? 'generateFlashcards' : 'saveDeck'}
        fullPage={false}
        className="create-step-ai-loading"
      />
      <p className="create-step-desc">This usually takes under a minute.</p>
    </div>
  );
}
