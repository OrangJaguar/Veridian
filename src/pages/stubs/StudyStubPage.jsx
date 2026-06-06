import { useParams } from 'react-router-dom';
import StubPage from '@/components/stubs/StubPage';

export default function StudyStubPage() {
  const { sessionId } = useParams();
  return (
    <StubPage
      title="Study Session"
      phase="Phase 6"
      description={`Active study session ${sessionId} will run here once study modes are rebuilt in React.`}
      loginAction="save study session progress"
    />
  );
}
