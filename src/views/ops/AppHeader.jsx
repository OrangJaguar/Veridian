export function AppHeader({ user, onSignIn, onSignOut }) {
  return (
    <header>
      <h1 id="logoText" title="Return to Dashboard">
        Veridian
      </h1>
      <div className="header-controls">
        <button id="profileBtn" type="button" className="profile-btn" title="Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </button>
        <div id="profileMenu" className="profile-dropdown hidden">
          <div id="veridianAccountSection">
            {user ? (
              <>
                <div style={{ padding: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '0.35rem', wordBreak: 'break-all' }}>
                  {user.email}
                </div>
                <button type="button" className="profile-item" id="veridianSignOutBtn" onClick={onSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" className="profile-item" id="veridianSignInBtn" onClick={onSignIn}>
                ☁ Sign in / sync
              </button>
            )}
          </div>
          <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />
          <button id="openSettingsBtn" type="button" className="profile-item">
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return <footer>Copyright © 2026 Developed by Sanskar Gupta. All Rights Reserved. v3.0</footer>;
}
