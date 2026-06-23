import { Navigate, useParams } from 'react-router-dom';

export function RedirectAdminJourney() {
  const { journeyId } = useParams();
  return <Navigate to={`/admin/journeys/${journeyId}`} replace />;
}

export function RedirectAdminModule() {
  const { journeyId, moduleId } = useParams();
  return <Navigate to={`/admin/journeys/${journeyId}/modules/${moduleId}`} replace />;
}
