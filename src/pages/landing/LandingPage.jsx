import { Link } from 'react-router-dom';
import PublicOnly from '@/components/routing/PublicOnly';

export default function LandingPage() {
  return (
    <PublicOnly>
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '4rem 1.5rem 3rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2 }}>
          Study smarter. Actually remember it.
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '2rem', fontSize: '1rem' }}>
          Veridian builds personalized study journeys from your own material, then uses spaced repetition to make sure nothing gets forgotten before exam day.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/signup" className="btn btn-primary" style={{ minWidth: 200, justifyContent: 'center' }}>
            Get Started
          </Link>
          <Link to="/library" className="btn" style={{ minWidth: 200, justifyContent: 'center' }}>
            Browse Community Library
          </Link>
          <Link to="/app" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Continue without an account
          </Link>
        </div>
      </div>
    </PublicOnly>
  );
}
