import { useParams } from 'react-router-dom';
import StubPage from '@/components/stubs/StubPage';

export default function ModuleDetailStubPage() {
  const { id, moduleId } = useParams();
  return (
    <StubPage
      title="Module Detail"
      phase="Phase 3"
      description={`Module ${moduleId} in Journey ${id}. Activity list and study entry points will appear here.`}
      loginAction="study this module"
    />
  );
}
