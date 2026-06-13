import { Link } from 'react-router-dom';

export default function DiagnosticBanner({ journey, journeyId }) {
  if (!journey || journey.diagnosticSummary) return null;

  if (journey.diagnosticSkipped) {
    return (
      <section className="diagnostic-banner diagnostic-banner-skipped">
        <p>
          You skipped the diagnostic — module stages may not reflect your actual knowledge.
        </p>
        <Link to={`/journeys/${journeyId}/diagnostic`} className="btn btn-secondary btn-sm">
          Take diagnostic now
        </Link>
      </section>
    );
  }

  return (
    <section className="diagnostic-banner">
      <p>
        Take a quick diagnostic to place each module at the right stage before you start studying.
      </p>
      <Link to={`/journeys/${journeyId}/diagnostic`} className="btn btn-primary btn-sm">
        Start diagnostic
      </Link>
    </section>
  );
}
