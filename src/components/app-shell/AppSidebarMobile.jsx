import { NavLink } from 'react-router-dom';
import { Home, Map, Users, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/journeys', label: 'Journeys', icon: Map },
  { to: '/library', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function AppSidebarMobile() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '0.5rem 0.25rem calc(0.5rem + env(safe-area-inset-bottom))',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.35rem 0.5rem',
            fontSize: '0.65rem',
            fontWeight: 500,
            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            textDecoration: 'none',
            minWidth: 64,
          })}
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
