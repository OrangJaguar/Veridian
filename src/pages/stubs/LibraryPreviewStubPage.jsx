import { useParams, Link } from 'react-router-dom';
import LoginPrompt from '@/components/stubs/LoginPrompt';

export default function LibraryPreviewStubPage() {
  const { journeyId } = useParams();

  return (
    <div className="stub-page">
      <p className="stub-phase">Phase 8</p>
      <h1 className="stub-title">Journey Preview</h1>
      <p className="stub-description">
        Public preview for Journey{' '}
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>{journeyId}</code>
        {' '}will be available when the Community Library launches.
      </p>
      <LoginPrompt action="clone this Journey" />
      <Link to="/library" className="btn" style={{ marginTop: '1rem' }}>
        Back to Library
      </Link>
    </div>
  );
}
