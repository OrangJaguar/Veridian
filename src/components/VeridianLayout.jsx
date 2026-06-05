import { useEffect, useState } from 'react';
import '../css/app.css';
import { runVeridianApp } from '../axiom/runVeridianApp';
import { AppHeader, AppFooter } from '../views/ops/AppHeader';
import { PromptAndPreviewModals, SettingsModals } from '../views/ops/AppOverlays';
import { DashboardMain } from '../views/ops/DashboardMain';
import { FlashcardMain } from '../views/ops/FlashcardMain';
import { QuizMain } from '../views/ops/QuizMain';
import { TypingMain } from '../views/ops/TypingMain';
import { SummaryMain } from '../views/ops/SummaryMain';
import { EditorMain } from '../views/ops/EditorMain';
import { MasterySummaryMain } from '../views/ops/MasterySummaryMain';
import AuthModal from './AuthModal';
import SyncBanner from './SyncBanner';

let veridianBooted = false;

window.__veridianAuthCallbacks = { onUserLoaded: null };

export default function VeridianLayout() {
  const [user, setUser] = useState(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    window.__veridianAuthCallbacks.onUserLoaded = (u) => {
      setUser(u);
      if (!u) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    if (veridianBooted) return;
    veridianBooted = true;
    runVeridianApp();
  }, []);

  async function handleAuthSuccess(loggedInUser) {
    setShowAuthModal(false);
    setShowBanner(false);
    setSyncing(true);
    try {
      if (window.__veridianOnSignedIn) await window.__veridianOnSignedIn(loggedInUser);
      setUser(loggedInUser);
    } finally {
      setSyncing(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setTimeout(() => setShowBanner(true), 2000);
  }

  useEffect(() => {
    if (user === undefined) return;
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (!profileBtn || !profileMenu) return;

    const accountSection = document.getElementById('veridianAccountSection');
    if (accountSection) {
      if (user) {
        accountSection.innerHTML = `
          <div style="padding: 0.4rem; font-size: 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); margin-bottom: 0.35rem; word-break: break-all;">${user.email}</div>
          <button class="profile-item" id="veridianSignOutBtn">Sign out</button>
        `;
        document.getElementById('veridianSignOutBtn')?.addEventListener('click', async () => {
          profileMenu.classList.add('hidden');
          await import('../api/base44Client').then(m => m.base44.auth.logout());
          handleSignOut();
        });
      } else {
        accountSection.innerHTML = `<button class="profile-item" id="veridianSignInBtn">☁ Sign in / sync</button>`;
        document.getElementById('veridianSignInBtn')?.addEventListener('click', () => {
          profileMenu.classList.add('hidden');
          setShowAuthModal(true);
        });
      }
    }
  }, [user]);

  return (
    <div className="app-wrapper">
      <AppHeader />
      <DashboardMain />
      <EditorMain />
      <FlashcardMain />
      <TypingMain />
      <QuizMain />
      <SummaryMain />
      <MasterySummaryMain />
      <AppFooter />
      <PromptAndPreviewModals />
      <SettingsModals />

      {syncing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem 2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>☁</div>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Syncing your data…</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Merging local data with your account</div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showBanner && !user && !showAuthModal && (
        <SyncBanner onSignIn={() => { setShowBanner(false); setShowAuthModal(true); }} />
      )}
    </div>
  );
}
