import { useParams } from 'react-router-dom';
import StubPage from '@/components/stubs/StubPage';

export default function JourneyDetailStubPage() {
  const { id } = useParams();
  return (
    <StubPage
      title="Journey Detail"
      phase="Phase 3"
      description={`Journey detail view for ID: ${id}. Module overview, progress, and activities will appear here.`}
    />
  );
}
