import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { AiFailureCard } from '@/components/study/StudyAiStatus';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';

export default function StepProcessing({ onBack, onRetry }) {
  const isProcessing = useJourneyCreateStore((s) => s.isProcessing);
  const processingError = useJourneyCreateStore((s) => s.processingError);
  const proposalProgress = useJourneyCreateStore((s) => s.proposalProgress);
  const partialProposal = useJourneyCreateStore((s) => s.partialProposal);

  const progressDetail = proposalProgress?.phase === 'concepts' && proposalProgress.moduleCount
    ? proposalProgress.moduleIndex === proposalProgress.moduleCount
      ? `Mapping concepts — module ${proposalProgress.moduleIndex} of ${proposalProgress.moduleCount}`
      : `Mapping concepts — module ${proposalProgress.moduleIndex} of ${proposalProgress.moduleCount}`
    : proposalProgress?.phase === 'outline'
      ? 'Planning modules…'
      : null;

  const activeStepIndex = proposalProgress?.phase === 'outline'
    ? 1
    : proposalProgress?.moduleCount
      ? Math.min(2, Math.floor((proposalProgress.moduleIndex / proposalProgress.moduleCount) * 3))
      : 0;

  const savedModules = partialProposal?.modules?.filter((m) => m.concepts?.length)?.length ?? 0;
  const totalModules = partialProposal?.modules?.length
    ?? proposalProgress?.moduleCount
    ?? 0;

  return (
    <div className="create-step create-processing">
      {isProcessing && !processingError && (
        <AiGenerationLoading
          action="proposeJourney"
          fullPage={false}
          className="create-step-ai-loading"
          activeStepIndex={activeStepIndex}
          progressDetail={progressDetail}
        />
      )}

      {processingError && (
        <AiFailureCard
          variant="journey"
          title="Couldn't finish building your Journey"
          message={processingError}
          progress={savedModules > 0 && totalModules > 0
            ? { completed: savedModules, total: totalModules, label: 'modules' }
            : null}
          onRetry={onRetry}
          onExit={onBack}
          exitLabel="Try pasting text instead"
          retryLabel="Continue generating"
        />
      )}
    </div>
  );
}
