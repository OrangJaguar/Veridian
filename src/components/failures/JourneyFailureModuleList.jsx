import { Link } from 'react-router-dom';
import ModuleFailureModePill from '@/components/failures/ModuleFailureModePill';

export default function JourneyFailureModuleList({ moduleSummaries = [], journeyId }) {
  if (!moduleSummaries.length) return null;

  return (
    <div className="journey-failure-module-list">
      <span className="journey-failure-module-list-label">By module</span>
      <ul className="journey-failure-module-rows">
        {moduleSummaries.map((summary) => (
          <li key={summary.moduleId} className="journey-failure-module-row">
            <Link
              to={`/journeys/${journeyId}/modules/${summary.moduleId}`}
              className="journey-failure-module-row-link"
            >
              <span className="journey-failure-module-row-name">{summary.moduleName}</span>
              {summary.topConcept && (
                <span className="journey-failure-module-row-concept">{summary.topConcept}</span>
              )}
            </Link>
            <ModuleFailureModePill
              modeId={summary.primaryMode}
              confidence={summary.confidence}
              compact
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
