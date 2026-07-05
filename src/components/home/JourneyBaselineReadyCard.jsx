import { Link } from 'react-router-dom';

export default function JourneyBaselineReadyCard({ journey }) {
  const label = journey.sourceTopic || journey.title || 'Journey';

  return (
    <div className="journey-baseline-ready-card">
      <p className="journey-baseline-ready-title">Diagnostic ready: {label}</p>
      <p className="journey-baseline-ready-body">
        See where your knowledge breaks down before you study — recognition, application, and transfer.
      </p>
      <Link to={`/journeys/${journey.journeyId}/diagnostic`} className="btn btn-primary btn-sm">
        Start diagnostic
      </Link>
    </div>
  );
}
