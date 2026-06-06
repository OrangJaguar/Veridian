import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSidebar from '@/components/app-shell/AppSidebar';
import AppSidebarMobile from '@/components/app-shell/AppSidebarMobile';
import AppFooter from '@/components/layout/AppFooter';
import VeridianLogo from '@/components/layout/VeridianLogo';
import { applyThemeFromStorage } from '@/lib/theme';

export default function AppShell() {
  const isMobile = useIsMobile();

  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div className="app-shell">
      {!isMobile && <AppSidebar />}
      <div className="app-shell-main">
        {isMobile && (
          <header className="site-header app-shell-mobile-header">
            <Link to="/" className="app-sidebar-logo-link" title="Veridian home">
              <VeridianLogo size={32} />
            </Link>
          </header>
        )}
        <main className="app-shell-content">
          <Outlet />
        </main>
        <AppFooter />
      </div>
      {isMobile && <AppSidebarMobile />}
    </div>
  );
}
