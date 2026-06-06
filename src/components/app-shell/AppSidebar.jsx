import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import VeridianLogo from '@/components/layout/VeridianLogo';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import SidebarNavLink from '@/components/app-shell/SidebarNavLink';

export default function AppSidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-wordmark">
        <Link to="/" className="app-sidebar-logo-link" title="Veridian home">
          <VeridianLogo size={28} />
        </Link>
      </div>
      <nav className="app-sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <SidebarNavLink key={to} to={to} label={label} icon={icon} end={to === '/home'} />
        ))}
      </nav>
      <div className="app-sidebar-footer">
        <SidebarNavLink to="/app" label="Study App" icon={BookOpen} />
      </div>
    </aside>
  );
}
