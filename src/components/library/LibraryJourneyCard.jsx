import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { certifiedAuthorLabel, isVeridianCertifiedJourney } from '@/lib/veridianCertified';

export default function LibraryJourneyCard({ journey }) {
  const cloneCount = journey.cloneCount ?? 0;
  const certified = isVeridianCertifiedJourney(journey);
  const author = certifiedAuthorLabel(journey);

  return (
    <Link
      to={`/library/${journey.journeyId}`}
      className={`library-journey-card${certified ? ' library-journey-card-certified' : ''}`}
    >
      {certified ? (
        <div className="library-journey-card-badges">
          <span className="veridian-certified-badge">
            <BadgeCheck size={12} aria-hidden />
            Certified
          </span>
        </div>
      ) : null}
      <h3 className="library-journey-title">{journey.title}</h3>
      {author && (
        <p className="library-journey-author">{author}</p>
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
