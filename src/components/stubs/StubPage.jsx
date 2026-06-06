import { Link } from 'react-router-dom';

export default function StubPage({ title, phase, description, children }) {
  return (
    <div style={{ padding: '2rem', maxWidth: 640 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        {phase}
      </p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{description}</p>
      {children}
      <Link to="/app" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        Open Study App
      </Link>
    </div>
  );
}
