import FailureModeBar from '@/components/failures/FailureModeBar';

const MAX_MODES = 4;

export default function FailureProfileRankedModes({ rankedModes = [] }) {
  if (rankedModes.length < 2) return null;

  const topModes = rankedModes.slice(0, MAX_MODES);
  const maxScore = Math.max(...topModes.map((m) => m.score), 1);

  return (
    <div className="failure-profile-rank">
      <span className="failure-profile-rank-label">Pattern strength</span>
      <div className="failure-profile-rank-bars">
        {topModes.map((mode) => {
          const widthPercent = (mode.score / maxScore) * 100;
          return (
            <FailureModeBar
              key={mode.modeId}
              modeId={mode.modeId}
              widthPercent={widthPercent}
              confidence={mode.confidence}
            />
          );
        })}
      </div>
    </div>
  );
}
