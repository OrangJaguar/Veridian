import { useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useSeedSampleJourney } from '@/hooks/mutations/useJourneyMutations';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import { toast } from 'sonner';

function examLabel(examDate) {
  if (!examDate) return 'No deadline';
  const days = differenceInDays(new Date(examDate), new Date());
  if (days < 0) return 'Past deadline';
  if (days === 0) return 'Exam today';
  if (days === 1) return 'Exam in 1 day';
  return `Exam in ${days} days`;
}

function JourneyCard({ journey }) {
  const { data: modules = [] } = useModules(journey.journeyId);

  return (
    <Link to={`/journeys/${journey.journeyId}`} className="journey-card">
      <div className="journey-card-top">
        <span className="journey-card-subject">{journey.subject}</span>
        <span className="journey-card-deadline">{examLabel(journey.examDate)}</span>
      </div>
      <h2 className="journey-card-title">{journey.title}</h2>
      <p className="journey-card-meta">
        {modules.length} module{modules.length === 1 ? '' : 's'}
        {journey.examDate && (
          <> · {format(new Date(journey.examDate), 'MMM d, yyyy')}</>
        )}
      </p>
    </Link>
  );
}

export default function JourneysStubPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('active');
  const archived = tab === 'archived';

  const { data: journeys = [], isLoading, error } = useJourneys({ archived });
  const seedMutation = useSeedSampleJourney();

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <p className="stub-phase">Phase 2</p>
        <h1 className="stub-title">Journeys</h1>
        <p className="stub-description">
          Your full Journey library — create, manage, and track progress across subjects.
        </p>
        <LoginPrompt action="create and manage Journeys" />
      </div>
    );
  }

  const handleSeed = () => {
    seedMutation.mutate(undefined, {
      onSuccess: () => toast.success('Sample Journey created'),
      onError: (err) => toast.error(err.message || 'Failed to seed Journey'),
    });
  };

  return (
    <div className="journeys-page">
      <header className="journeys-header">
        <div>
          <p className="stub-phase">Phase 2</p>
          <h1 className="journeys-title">Journeys</h1>
        </div>
        {import.meta.env.DEV && (
          <button
            type="button"
            className="btn btn-secondary journeys-seed-btn"
            onClick={handleSeed}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? 'Creating…' : 'Dev: Seed sample'}
          </button>
        )}
      </header>

      <div className="journeys-tabs">
        <button
          type="button"
          className={`journeys-tab${tab === 'active' ? ' active' : ''}`}
          onClick={() => setTab('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={`journeys-tab${tab === 'archived' ? ' active' : ''}`}
          onClick={() => setTab('archived')}
        >
          Archived
        </button>
      </div>

      {isLoading && <p className="journeys-status">Loading Journeys…</p>}
      {error && (
        <p className="journeys-error">
          {error.message || 'Could not load Journeys. Publish entity schemas to Base44 first.'}
        </p>
      )}

      {!isLoading && !error && journeys.length === 0 && (
        <div className="journeys-empty">
          <h2>No Journeys yet</h2>
          <p>
            {archived
              ? 'No archived Journeys.'
              : 'Create your first Journey in Phase 4, or use the dev seed button to test the data layer.'}
          </p>
        </div>
      )}

      {!isLoading && !error && journeys.length > 0 && (
        <div className="journeys-grid">
          {journeys.map((journey) => (
            <JourneyCard key={journey.journeyId ?? journey.id} journey={journey} />
          ))}
        </div>
      )}
    </div>
  );
}
