import { Link } from 'react-router-dom';

export default function JourneyProcessingCard({ journey }) {
  const label = journey.sourceTopic || journey.title || journey.subject || 'your topic';

  return (
    <div className="journey-processing-card" role="status" aria-live="polite">
      <h3 className="journey-processing-title">Forging your {label} Journey…</h3>
      <p className="journey-processing-body">
        Our engine is mapping concepts and building your baseline diagnostics. (ETA: ~2 minutes).
      </p>
      <div className="journey-processing-actions">
        <Link to="/library" className="btn btn-secondary btn-sm">Explore a Demo Journey</Link>
        <Link to="/library" className="btn btn-secondary btn-sm">Browse the Library</Link>
      </div>
    </div>
  );
}
