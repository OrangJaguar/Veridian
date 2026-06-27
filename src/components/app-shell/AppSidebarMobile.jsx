import { Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import {
  getToolsNavItems,
  TOOLS_CATALOG_NAV_ITEM,
  TOOLS_SETTINGS_ROUTE,
} from '@/components/app-shell/tools-nav-items';
import SidebarNavLink from '@/components/app-shell/SidebarNavLink';
import ToolsCatalogNavIcon from '@/components/app-shell/ToolsCatalogNavIcon';
import { usePinnedTools } from '@/hooks/queries/usePinnedTools';

export default function AppSidebarMobile() {
  const location = useLocation();
  const isTools = location.pathname.startsWith('/tools');
  const { pinnedToolIds } = usePinnedTools();
  const items = isTools ? getToolsNavItems(pinnedToolIds) : NAV_ITEMS;
  const mobileClass = isTools ? 'app-sidebar-mobile app-sidebar-mobile--tools' : 'app-sidebar-mobile';

  return (
    <nav className={mobileClass}>
      {isTools ? (
        <SidebarNavLink
          to={TOOLS_CATALOG_NAV_ITEM.to}
          label="Catalog"
          icon={ToolsCatalogNavIcon}
          end={location.pathname === TOOLS_CATALOG_NAV_ITEM.to}
          className="app-sidebar-mobile-link"
        />
      ) : null}
      {items.map(({ to, label, icon }) => (
        <SidebarNavLink
          key={to}
          to={to}
          label={label}
          icon={icon}
          end={to === '/home' || to === '/tools/dashboard'}
          className="app-sidebar-mobile-link"
        />
      ))}
      {isTools ? (
        <SidebarNavLink
          to={TOOLS_SETTINGS_ROUTE}
          label="Settings"
          icon={Settings}
          end={location.pathname === TOOLS_SETTINGS_ROUTE}
          className="app-sidebar-mobile-link"
        />
      ) : (
        <SidebarNavLink to="/settings" label="Settings" icon={Settings} className="app-sidebar-mobile-link" />
      )}
    </nav>
  );
}
