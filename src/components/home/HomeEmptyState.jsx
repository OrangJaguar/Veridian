import { Link } from 'react-router-dom';
import { usePublicJourneys } from '@/hooks/queries/usePublicJourneys';
import { getSampleLibraryJourneyHref } from '@/utils/library/getSampleLibraryJourney';

export default function HomeEmptyState() {
  const { data: publicJourneys = [] } = usePublicJourneys({ sort: 'cloned' });
  const sampleHref = getSampleLibraryJourneyHref(publicJourneys);

  return (
    <div className="home-empty">
      <h1 className="home-empty-title">Your queue is empty.</h1>
      <p className="home-empty-description">
        We can&apos;t tell you what to study tonight because we don&apos;t know what you&apos;re fighting.
      </p>
      <div className="home-empty-actions">
        <Link to="/journeys/new" className="btn btn-primary">
          Drop in a Syllabus or Topic
        </Link>
        <Link to={sampleHref} className="btn btn-secondary">
          Try a sample journey
        </Link>
        <Link to="/library" className="btn btn-secondary">
          Clone from Library
        </Link>
      </div>
    </div>
  );
}
