import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import VeridianLogo from '@/components/layout/VeridianLogo';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import {
  getToolsNavItems,
  TOOLS_CATALOG_NAV_ITEM,
  TOOLS_SETTINGS_ROUTE,
} from '@/components/app-shell/tools-nav-items';
import SidebarNavLink from '@/components/app-shell/SidebarNavLink';
import ToolsSidebarNav from '@/components/app-shell/ToolsSidebarNav';
import ToolsCatalogNavIcon from '@/components/app-shell/ToolsCatalogNavIcon';
import { usePinnedTools } from '@/hooks/queries/usePinnedTools';

export default function AppSidebar() {
  const location = useLocation();
  const isTools = location.pathname.startsWith('/tools');
  const { pinnedToolIds } = usePinnedTools();
  const items = isTools ? getToolsNavItems(pinnedToolIds) : NAV_ITEMS;

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-wordmark">
        <Link to="/" className="app-sidebar-logo-link" title="Veridian home">
          <VeridianLogo size={28} />
        </Link>
      </div>
      {isTools ? (
        <>
          <div className="tools-sidebar-catalog-slot">
            <SidebarNavLink
              to={TOOLS_CATALOG_NAV_ITEM.to}
              label="Catalog"
              icon={ToolsCatalogNavIcon}
              rawIcon
              end={location.pathname === TOOLS_CATALOG_NAV_ITEM.to}
              className="app-sidebar-link tools-sidebar-catalog-link"
            />
          </div>
          <ToolsSidebarNav items={items} />
        </>
      ) : (
        <nav className="app-sidebar-nav">
          {items.map(({ to, label, icon }) => (
            <SidebarNavLink
              key={to}
              to={to}
              label={label}
              icon={icon}
              end={to === '/home'}
            />
          ))}
        </nav>
      )}
      <div className="app-sidebar-footer">
        {isTools ? (
          <SidebarNavLink
            to={TOOLS_SETTINGS_ROUTE}
            label="Settings"
            icon={Settings}
            end={location.pathname === TOOLS_SETTINGS_ROUTE}
          />
        ) : (
          <SidebarNavLink to="/settings" label="Settings" icon={Settings} />
        )}
      </div>
    </aside>
  );
}
