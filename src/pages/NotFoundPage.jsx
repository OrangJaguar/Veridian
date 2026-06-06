import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  );
}
