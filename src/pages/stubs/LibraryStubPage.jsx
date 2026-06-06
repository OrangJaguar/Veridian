import { Link } from 'react-router-dom';

export default function LibraryStubPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        Phase 8
      </p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Community Library</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Browse and clone Journeys created by other Veridian students. Coming soon.
      </p>
      <Link to="/signup" className="btn btn-primary">
        Get Started
      </Link>
    </div>
  );
}
