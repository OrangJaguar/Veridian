import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Map, Users, User } from 'lucide-react';
import { applyThemeFromStorage } from '@/lib/theme';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/journeys', label: 'Journeys', icon: Map },
  { to: '/library', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppSidebar() {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      <div style={{ padding: '1.25rem 1rem' }}>
        <Link to="/home" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', textDecoration: 'none' }}>
          Veridian
        </Link>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.5rem', flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              textDecoration: 'none',
              background: isActive ? 'var(--surface-hover)' : 'transparent',
            })}
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <Link to="/app" className="btn" style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center' }}>
          Open Study App
        </Link>
      </div>
    </aside>
  );
}
