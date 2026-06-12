import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';

function examLabel(examDate) {
  if (!examDate) return 'No deadline';
  const days = differenceInDays(new Date(examDate), new Date());
  if (days < 0) return 'Past deadline';
  if (days === 0) return 'Exam today';
  if (days === 1) return 'Exam in 1 day';
  return `Exam in ${days} days`;
}

const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

export default function JourneyDetailStubPage() {
  const { id: journeyId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data: journey, isPending, error } = useJourney(journeyId);
  const { data: modules = [], isPending: modulesPending } = useModules(journeyId);

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <p className="stub-phase">Phase 2</p>
        <h1 className="stub-title">Journey Detail</h1>
        <p className="stub-description">Module overview, progress, and activities will appear here.</p>
        <LoginPrompt action="view and edit this Journey" />
      </div>
    );
  }

  if (isPending && !journey) {
    return <VeridianLoading fullPage />;
  }

  if (error || !journey) {
    return (
      <div className="journey-detail-page">
        <Link to="/journeys" className="journey-detail-back">← Journeys</Link>
        <p className="journeys-error">
          {error?.message || 'Journey not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="journey-detail-page">
      <Link to="/journeys" className="journey-detail-back">← Journeys</Link>

      <header className="journey-detail-header">
        <p className="stub-phase">Phase 2 · Read-only</p>
        <p className="journey-detail-subject">{journey.subject}</p>
        <h1 className="journey-detail-title">{journey.title}</h1>
        <p className="journey-detail-deadline">{examLabel(journey.examDate)}</p>
        {journey.examDate && (
          <p className="journey-detail-date">
            Target: {format(new Date(journey.examDate), 'MMMM d, yyyy')}
          </p>
        )}
      </header>

      <section className="journey-detail-modules">
        <h2 className="journey-detail-section-title">Modules</h2>
        {modulesPending && modules.length === 0 && <VeridianLoading size="sm" />}
        {!modulesPending && modules.length === 0 && (
          <p className="journey-detail-empty">No modules yet.</p>
        )}
        <ul className="journey-module-list">
          {modules.map((mod) => (
            <li key={mod.moduleId ?? mod.id} className="journey-module-item">
              <div className="journey-module-main">
                <strong>{mod.name}</strong>
                {mod.description && <span>{mod.description}</span>}
              </div>
              <span className={`journey-module-stage stage-${mod.stage || 'A'}`}>
                Stage {mod.stage || 'A'} · {STAGE_LABELS[mod.stage || 'A']}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
