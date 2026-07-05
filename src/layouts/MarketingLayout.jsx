import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from '@/components/layout/SiteHeader';
import AppFooter from '@/components/layout/AppFooter';
import { LandingChromeProvider, useLandingChrome } from '@/contexts/LandingChromeContext';
import { applyThemeFromStorage } from '@/lib/theme';

function MarketingLayoutBody() {
  const location = useLocation();
  const { baselineLocked } = useLandingChrome() ?? {};
  const isLanding = location.pathname === '/';
  const isLearnPage = location.pathname === '/learn';
  const chromeLocked = baselineLocked && !isLearnPage;

  return (
    <>
      <SiteHeader variant={isLanding ? 'landing' : 'default'} />
      <div className={`site-layout-body${chromeLocked ? ' site-layout-body--locked' : ''}`}>
        <Outlet />
      </div>
      {!chromeLocked && <AppFooter />}
    </>
  );
}

export default function MarketingLayout() {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <LandingChromeProvider>
      <div className="site-layout site-layout--marketing">
        <MarketingLayoutBody />
      </div>
    </LandingChromeProvider>
  );
}
