import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listAdminJourneys } from '@/api/admin/adminJourneys';

export default function AdminJourneysPage() {
  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ['admin', 'journeys'],
    queryFn: listAdminJourneys,
  });

  return (
    <div className="admin-journeys-page">
      <header className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">Admin Journeys</h1>
          <p className="admin-dashboard-lead">Create and publish Veridian Certified journeys manually.</p>
        </div>
        <Link to="/adminjourneys/new" className="btn btn-primary">New certified journey</Link>
      </header>

      {isLoading ? (
        <p className="journeys-status">Loading journeys…</p>
      ) : journeys.length === 0 ? (
        <p className="journeys-status">No admin journeys yet. Create your first certified journey.</p>
      ) : (
        <ul className="admin-journey-list">
          {journeys.map((j) => (
            <li key={j.journeyId} className="admin-journey-row">
              <div className="admin-journey-row-main">
                <strong>{j.title}</strong>
                <span className="admin-journey-meta">{j.subject}</span>
                <span className={`admin-journey-badge admin-journey-badge--${j.publishStatus ?? 'draft'}`}>
                  {j.publishStatus ?? 'draft'}
                </span>
                {j.isVeridianCertified && j.isPublic && (
                  <span className="admin-journey-badge admin-journey-badge--certified">Certified · Live</span>
                )}
              </div>
              <Link to={`/adminjourneys/${j.journeyId}`} className="btn btn-secondary btn-sm">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
