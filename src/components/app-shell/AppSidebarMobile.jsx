import { BookOpen } from 'lucide-react';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import SidebarNavLink from '@/components/app-shell/SidebarNavLink';

export default function AppSidebarMobile() {
  return (
    <nav className="app-sidebar-mobile">
      {NAV_ITEMS.map(({ to, label, icon }) => (
        <SidebarNavLink
          key={to}
          to={to}
          label={label}
          icon={icon}
          end={to === '/home'}
          className="app-sidebar-mobile-link"
        />
      ))}
      <SidebarNavLink to="/app" label="Study App" icon={BookOpen} className="app-sidebar-mobile-link" />
    </nav>
  );
}
