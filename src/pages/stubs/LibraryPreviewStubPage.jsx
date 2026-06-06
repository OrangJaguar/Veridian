import { useParams, Link } from 'react-router-dom';

export default function LibraryPreviewStubPage() {
  const { journeyId } = useParams();
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        Phase 8
      </p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Journey Preview</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Public preview for Journey <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>{journeyId}</code> will be available when the Community Library launches.
      </p>
      <Link to="/library" className="btn">
        Back to Library
      </Link>
    </div>
  );
}
