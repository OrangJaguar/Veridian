import { useEffect, useState } from 'react';
import '../css/app.css';
import { runAxiomApp } from '../axiom/runAxiomApp';
import { AppHeader, AppFooter } from '../views/ops/AppHeader';
import {
  PromptAndPreviewModals,
  CmdAndAgendaModals,
  CalendarModals,
  JournalAndSettingsModals,
  CmdSidebarOverlay,
} from '../views/ops/AppOverlays';
import { DashboardMain } from '../views/ops/DashboardMain';
import { FlashcardMain } from '../views/ops/FlashcardMain';
import { QuizMain } from '../views/ops/QuizMain';
import { TypingMain } from '../views/ops/TypingMain';
import { SummaryMain } from '../views/ops/SummaryMain';
import { EditorMain } from '../views/ops/EditorMain';
import { MasterySummaryMain } from '../views/ops/MasterySummaryMain';
import { CmdMain } from '../views/ops/CmdMain';
import AuthModal from './AuthModal';
import SyncBanner from './SyncBanner';

let axiomBooted = false;

// Global callbacks so runAxiomApp can trigger React state
window.__axiomAuthCallbacks = { onUserLoaded: null };

export default function AxiomLayout() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = guest, object = logged in
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Register callback for runAxiomApp to call when auth is determined
    window.__axiomAuthCallbacks.onUserLoaded = (u) => {
      setUser(u);
      if (!u) {
        // Show banner after 3s for guests
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    if (axiomBooted) return;
    axiomBooted = true;
    runAxiomApp();
  }, []);

  async function handleAuthSuccess(loggedInUser) {
    setShowAuthModal(false);
    setShowBanner(false);
    setSyncing(true);
    try {
      // Tell the running app engine about the new user (triggers migration + reload)
      if (window.__axiomOnSignedIn) await window.__axiomOnSignedIn(loggedInUser);
      setUser(loggedInUser);
    } finally {
      setSyncing(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setTimeout(() => setShowBanner(true), 2000);
  }

  // Inject user state into header controls
  useEffect(() => {
    if (user === undefined) return;
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (!profileBtn || !profileMenu) return;

    // Update profile menu to show account info
    const accountSection = document.getElementById('axiomAccountSection');
    if (accountSection) {
      if (user) {
        accountSection.innerHTML = `
          <div style="padding: 0.4rem; font-size: 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); margin-bottom: 0.35rem; word-break: break-all;">${user.email}</div>
          <button class="profile-item" id="axiomSignOutBtn">Sign out</button>
        `;
        document.getElementById('axiomSignOutBtn')?.addEventListener('click', async () => {
          profileMenu.classList.add('hidden');
          await import('../api/base44Client').then(m => m.base44.auth.logout());
          handleSignOut();
        });
      } else {
        accountSection.innerHTML = `<button class="profile-item" id="axiomSignInBtn">☁ Sign in / sync</button>`;
        document.getElementById('axiomSignInBtn')?.addEventListener('click', () => {
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
      <CmdMain />
      <EditorMain />
      <FlashcardMain />
      <TypingMain />
      <QuizMain />
      <SummaryMain />
      <MasterySummaryMain />
      <AppFooter />
      <PromptAndPreviewModals />
      <CmdAndAgendaModals />
      <CalendarModals />
      <JournalAndSettingsModals />
      <CmdSidebarOverlay />

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