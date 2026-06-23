import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUiStore } from '@/store/uiStore';
import AppSidebar from '@/components/app-shell/AppSidebar';
import AppSidebarMobile from '@/components/app-shell/AppSidebarMobile';
import AppFooter from '@/components/layout/AppFooter';
import AiQuotaNotice from '@/components/ai/AiQuotaNotice';
import VeridianLogo from '@/components/layout/VeridianLogo';
import ThemeSync from '@/components/ThemeSync';
import SyncUserDisplayName from '@/components/auth/SyncUserDisplayName';
import { applyThemeFromStorage } from '@/lib/theme';

export default function AppShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const immersiveChrome = useUiStore((s) => s.immersiveChrome);
  const isStudyRoute = location.pathname.startsWith('/study');
  const hideChrome = isStudyRoute || immersiveChrome;

  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div className={`app-shell${hideChrome ? ' app-shell--immersive' : ''}`}>
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
        {!hideChrome && <AppFooter />}
      </div>
      {!hideChrome && isMobile && <AppSidebarMobile />}
      <AiQuotaNotice />
    </div>
  );
}
