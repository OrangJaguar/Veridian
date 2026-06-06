import { useEffect, useState } from 'react';
import '../css/app.css';
import { runVeridianApp } from '../engine/runVeridianApp';
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
import { useAuth } from '@/hooks/useAuth';

let veridianBooted = false;

if (typeof window !== 'undefined' && !window.__veridianAuthCallbacks) {
  window.__veridianAuthCallbacks = { onUserLoaded: null };
}

export default function VeridianLayout() {
  const { user, isLoading, setUser, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (veridianBooted) return;
    veridianBooted = true;
    runVeridianApp();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
    setShowBanner(false);
  }, [user, isLoading]);

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

  async function handleSignOut() {
    document.getElementById('profileMenu')?.classList.add('hidden');
    await signOut();
    setTimeout(() => setShowBanner(true), 2000);
  }

  function handleSignInClick() {
    document.getElementById('profileMenu')?.classList.add('hidden');
    setShowAuthModal(true);
  }

  return (
    <div className="app-wrapper">
      <AppHeader user={user} onSignIn={handleSignInClick} onSignOut={handleSignOut} />
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

      {showBanner && !user && !showAuthModal && !isLoading && (
        <SyncBanner onSignIn={() => { setShowBanner(false); setShowAuthModal(true); }} />
      )}
    </div>
  );
}
