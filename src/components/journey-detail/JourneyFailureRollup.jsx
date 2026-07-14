import JourneyFailureModeChart from '@/components/failures/JourneyFailureModeChart';
import JourneyFailureModuleList from '@/components/failures/JourneyFailureModuleList';
import {
  formatJourneyEmptyState,
  formatExamProximity,
} from '@/utils/failures/formatFailureCopy';

export default function JourneyFailureRollup({
  rollup,
  journeyId,
  totalModules = 0,
}) {
  const hasData = rollup?.hasData && rollup?.rankedConcerns?.length > 0;
  const emptyCopy = formatJourneyEmptyState({
    modulesWithEvidence: rollup?.modulesWithEvidence ?? 0,
    totalModules: totalModules || rollup?.modulesWithEvidence,
  });
  const examLine = formatExamProximity(rollup?.daysToExam);

  return (
    <section className="journey-failure-rollup detail-section-box" aria-label="Learning patterns overview">
      <div className="journey-failure-rollup-header">
        <h3 className="journey-failure-rollup-title">Patterns across modules</h3>
        {examLine && (
          <span className="journey-failure-rollup-exam">{examLine}</span>
        )}
      </div>

      {hasData ? (
        <>
          <p className="journey-failure-rollup-lead">
            Detected from your study sessions — Veridian adapts practice to these patterns.
          </p>
          <JourneyFailureModeChart rankedConcerns={rollup.rankedConcerns} />
          <JourneyFailureModuleList
            moduleSummaries={rollup.moduleSummaries}
            journeyId={journeyId}
          />
        </>
      ) : (
        <p className="journey-failure-rollup-empty">{emptyCopy}</p>
      )}
    </section>
  );
}
