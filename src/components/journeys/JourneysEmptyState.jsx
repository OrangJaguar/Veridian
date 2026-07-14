import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { usePublicJourneys } from '@/hooks/queries/usePublicJourneys';
import { getSampleLibraryJourneyHref } from '@/utils/library/getSampleLibraryJourney';

export default function JourneysEmptyState({ archived = false }) {
  const { data: publicJourneys = [] } = usePublicJourneys({ sort: 'cloned' });
  const sampleHref = getSampleLibraryJourneyHref(publicJourneys);

  if (archived) {
    return (
      <div className="journeys-empty-state">
        <p className="journeys-empty-state-text">No archived journeys.</p>
      </div>
    );
  }

  return (
    <div className="journeys-empty-state">
      <div className="journeys-empty-state-icon" aria-hidden="true">
        <Map size={40} strokeWidth={1.5} />
      </div>
      <h2 className="journeys-empty-state-title">Your first journey starts here</h2>
      <p className="journeys-empty-state-text">
        A journey is a structured study path built around a subject or exam — modules, review
        schedule, and activities that adapt as you learn.
      </p>
      <div className="journeys-empty-state-actions">
        <Link to="/journeys/new" className="btn btn-primary">
          Create Journey
        </Link>
        <Link to={sampleHref} className="btn btn-secondary">
          Try a sample journey
        </Link>
        <Link to="/library" className="btn btn-secondary">
          Browse Community Library
        </Link>
      </div>
    </div>
  );
}
