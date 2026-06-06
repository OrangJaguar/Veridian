import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { applyThemeFromStorage } from '@/lib/theme';

export default function MarketingLayout() {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', textDecoration: 'none' }}>
          Veridian
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/signin" className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            Sign in
          </Link>
          <Link to="/signup" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            Get Started
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
