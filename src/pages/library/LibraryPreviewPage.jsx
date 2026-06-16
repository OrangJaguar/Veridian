import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLibraryPreview } from '@/hooks/queries/useLibraryPreview';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import CloneJourneyModal from '@/components/library/CloneJourneyModal';

const ACTIVITY_LABELS = {
  learningGuide: 'Learning guide',
  practiceQuiz: 'Practice quiz',
  feynman: 'Feynman',
  freeRecall: 'Free recall',
  flashcardSet: 'Flashcards',
};

export default function LibraryPreviewPage() {
  const { journeyId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useLibraryPreview(journeyId);
  const [cloneOpen, setCloneOpen] = useState(false);

  if (isLoading) return <VeridianLoading fullPage />;

  if (error || !data) {
    return (
      <div className="library-preview-page">
        <p className="library-error">Journey not found or not public.</p>
        <Link to="/library" className="btn">Back to Library</Link>
      </div>
    );
  }

  const { journey, modules } = data;

  return (
    <div className="library-preview-page">
      {!isAuthenticated && (
        <div className="library-preview-banner">
          <LoginPrompt action="clone this journey" />
        </div>
      )}

      <Link to="/library" className="journey-detail-back">← Community Library</Link>

      <header className="library-preview-header">
        <p className="library-preview-subject">{journey.subject}</p>
        <h1 className="library-preview-title">{journey.title}</h1>
        <div className="library-preview-meta">
          {journey.creatorUsername && (
            <span>by @{journey.creatorUsername}</span>
          )}
          <span>{journey.cloneCount ?? 0} clones</span>
        </div>
        {(journey.tags ?? []).length > 0 && (
          <div className="library-journey-tags">
            {journey.tags.map((tag) => (
              <span key={tag} className="library-tag">{tag}</span>
            ))}
          </div>
        )}
      </header>

      <section className="library-preview-modules detail-section-box">
        <h2 className="library-preview-section-title">Modules ({modules.length})</h2>
        <ul className="library-preview-module-list">
          {modules.map((mod) => (
            <li key={mod.moduleId} className="library-preview-module-item">
              <strong>{mod.name}</strong>
              {mod.description && <p>{mod.description}</p>}
              <p className="library-preview-activity-types">
                Includes:{' '}
                {[...new Set(mod.activityTypes)]
                  .map((t) => ACTIVITY_LABELS[t] ?? t)
                  .join(', ')}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="library-preview-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!isAuthenticated) return;
            setCloneOpen(true);
          }}
          disabled={!isAuthenticated}
        >
          Clone this journey
        </button>
        {!isAuthenticated && (
          <p className="library-preview-signin-hint">Sign in to clone and start studying</p>
        )}
      </div>

      {cloneOpen && (
        <CloneJourneyModal
          journeyId={journeyId}
          sourceTitle={journey.title}
          modules={modules}
          onClose={() => setCloneOpen(false)}
        />
      )}
    </div>
  );
}
