import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHubToggleShortcut } from '@/hooks/useHubToggleShortcut';
import { useUiStore } from '@/store/uiStore';
import AppSidebar from '@/components/app-shell/AppSidebar';
import AppSidebarMobile from '@/components/app-shell/AppSidebarMobile';
import AppFooter from '@/components/layout/AppFooter';
import AiQuotaNotice from '@/components/ai/AiQuotaNotice';
import { CommandBarProvider } from '@/components/command-bar/CommandBarProvider';
import VeridianLogo from '@/components/layout/VeridianLogo';
import ThemeSync from '@/components/ThemeSync';
import SyncUserDisplayName from '@/components/auth/SyncUserDisplayName';
import { applyThemeFromStorage } from '@/lib/theme';

export default function AppShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  useHubToggleShortcut();
  const immersiveChrome = useUiStore((s) => s.immersiveChrome);
  const toolsChromeCollapsed = useUiStore((s) => s.toolsChromeCollapsed);
  const isStudyRoute = location.pathname.startsWith('/study');
  const isToolsRoute = location.pathname.startsWith('/tools');
  const hideStudyChrome = isStudyRoute || immersiveChrome;
  const hideToolsChrome = isToolsRoute && toolsChromeCollapsed;
  const hideChrome = hideStudyChrome || hideToolsChrome;

  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  const shellClass = [
    'app-shell',
    hideStudyChrome ? 'app-shell--immersive' : '',
    hideToolsChrome ? 'app-shell--tools-immersive' : '',
  ].filter(Boolean).join(' ');

  return (
    <CommandBarProvider>
    <div className={shellClass}>
      <ThemeSync />
      <SyncUserDisplayName />
      {!hideChrome && !isMobile && <AppSidebar />}
      <div className="app-shell-main">
        {!hideChrome && isMobile && (
          <header className="site-header app-shell-mobile-header">
            <Link to="/" className="app-sidebar-logo-link" title="Veridian home">
              <VeridianLogo size={32} />
            </Link>
          </header>
        )}
        <main className="app-shell-content">
          <Outlet />
        </main>
        {!hideChrome && (
          <div className="app-shell-bottom-chrome">
            {isMobile && <AppSidebarMobile />}
            <AppFooter />
          </div>
        )}
      </div>
      <AiQuotaNotice />
    </div>
    </CommandBarProvider>
  );
}
