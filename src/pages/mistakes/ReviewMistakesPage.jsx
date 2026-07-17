import { useAuth } from '@/hooks/useAuth';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import ReviewMistakesPanel from '@/components/study/mistakes/ReviewMistakesPanel';

export default function ReviewMistakesPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Review Mistakes</h1>
        <LoginPrompt action="review your mistakes" />
      </div>
    );
  }

  return <ReviewMistakesPanel />;
}
