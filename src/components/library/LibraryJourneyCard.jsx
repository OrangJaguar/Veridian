import { Link } from 'react-router-dom';
import { getJourneyCategory } from '@/lib/library/libraryTags';

export default function LibraryJourneyCard({ journey }) {
  const category = getJourneyCategory(journey);
  const cloneCount = journey.cloneCount ?? 0;

  return (
    <Link to={`/library/${journey.journeyId}`} className="library-journey-card">
      <div className="library-journey-card-top">
        <span className="library-journey-subject">{journey.subject}</span>
        {category && <span className="library-journey-category">{category}</span>}
      </div>
      <h3 className="library-journey-title">{journey.title}</h3>
      {journey.creatorUsername && (
        <p className="library-journey-author">@{journey.creatorUsername}</p>
      )}
      {(journey.tags ?? []).length > 0 && (
        <div className="library-journey-tags">
          {journey.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="library-tag">{tag}</span>
          ))}
        </div>
      )}
      <p className="library-journey-meta">
        {cloneCount} clone{cloneCount === 1 ? '' : 's'}
        {journey.knowledgeMap?.moduleCount != null && (
          <> · {journey.knowledgeMap.moduleCount} modules</>
        )}
      </p>
    </Link>
  );
}
