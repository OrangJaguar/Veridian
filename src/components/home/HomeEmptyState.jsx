import { Link } from 'react-router-dom';
import { notifyCreateJourney } from '@/components/home/DueTodayCard';

export default function HomeEmptyState({ devTools }) {
  return (
    <div className="home-page home-page-empty">
      {devTools}
      <div className="home-empty">
        <h1 className="home-empty-title">Welcome to Veridian</h1>
        <p className="home-empty-description">
          Veridian builds a personalized study plan from your material — modules, review schedule,
          and a clear Due Today list so you always know what to work on next.
        </p>
        <div className="home-empty-actions">
          <button type="button" className="btn btn-primary" onClick={notifyCreateJourney}>
            Create Your First Journey
          </button>
          <Link to="/library" className="btn btn-secondary">
            Browse Community Library
          </Link>
        </div>
        <div className="home-empty-preview" aria-hidden="true">
          <div className="home-empty-preview-card">
            <span className="journey-card-subject">Example Subject</span>
            <strong className="journey-card-title">Your first Journey</strong>
            <span className="journey-card-deadline">Exam in 14 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
