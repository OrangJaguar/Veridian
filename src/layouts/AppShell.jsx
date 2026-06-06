import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSidebar from '@/components/app-shell/AppSidebar';
import AppSidebarMobile from '@/components/app-shell/AppSidebarMobile';
import { applyThemeFromStorage } from '@/lib/theme';
import { useEffect } from 'react';

export default function AppShell() {
  const isMobile = useIsMobile();

  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
      {!isMobile && <AppSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <header style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border)',
            fontWeight: 700,
            fontSize: '1.05rem',
          }}>
            Veridian
          </header>
        )}
        <main style={{ flex: 1, paddingBottom: isMobile ? '4.5rem' : 0, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
      {isMobile && <AppSidebarMobile />}
    </div>
  );
}
