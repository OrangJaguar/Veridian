import { useModuleFailureProfile } from '@/hooks/queries/useModuleFailureProfile';
import { formatSessionInsight } from '@/utils/failures/formatFailureCopy';

export default function DueItemFailureHint({ moduleId, journeyId }) {
  const { data: profile } = useModuleFailureProfile(moduleId, journeyId);
  const hint = formatSessionInsight(profile);

  if (!hint) return null;

  return (
    <span className="home-focus-failure-hint">{hint}</span>
  );
}
