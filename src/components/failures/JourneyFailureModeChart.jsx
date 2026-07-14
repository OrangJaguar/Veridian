import FailureModeBar from '@/components/failures/FailureModeBar';

export default function JourneyFailureModeChart({ rankedConcerns = [] }) {
  if (!rankedConcerns.length) return null;

  const maxCount = Math.max(...rankedConcerns.map((c) => c.moduleCount), 1);

  return (
    <div className="journey-failure-chart">
      <span className="journey-failure-chart-label">By pattern</span>
      <div className="journey-failure-chart-bars">
        {rankedConcerns.map((concern) => {
          const widthPercent = (concern.moduleCount / maxCount) * 100;
          return (
            <FailureModeBar
              key={concern.modeId}
              modeId={concern.modeId}
              label={concern.title}
              widthPercent={widthPercent}
              metric={`${concern.moduleCount} module${concern.moduleCount === 1 ? '' : 's'}`}
              ariaLabel={`${concern.title}: ${concern.moduleCount} modules`}
            />
          );
        })}
      </div>
    </div>
  );
}
