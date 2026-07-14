import { Link } from 'react-router-dom';
import { resolveJourneyPacingMode } from '@/utils/planner/pacingMode';

function KeepSharpBanner({ journey }) {
  return (
    <div className="home-keep-sharp-banner">
      <div className="home-keep-sharp-banner-text">
        <strong>{journey.title}</strong>
        <span>No exam pressure — light spaced practice + retention</span>
      </div>
      <div className="home-cram-banner-actions">
        <Link to={`/journeys/${journey.journeyId}`} className="btn btn-secondary btn-sm">
          Open Journey
        </Link>
      </div>
    </div>
  );
}

export default function HomeKeepSharpZone({ journeys = [] }) {
  const keepSharp = journeys.filter(
    (j) => !j.archived && resolveJourneyPacingMode(j.examDate) === 'keepSharp',
  );

  if (keepSharp.length === 0) return null;

  return (
    <section className="home-keep-sharp" aria-labelledby="keep-sharp-heading">
      <h2 id="keep-sharp-heading" className="home-keep-sharp-title">Keep sharp</h2>
      <div className="home-cram-stack">
        {keepSharp.map((journey) => (
          <KeepSharpBanner key={journey.journeyId ?? journey.id} journey={journey} />
        ))}
      </div>
    </section>
  );
}
