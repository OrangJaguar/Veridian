export function AppHeader() {
  return (
    <header>
      <h1 id="logoText" title="Return to Dashboard">
        Axiom
      </h1>
      <button id="cmdMenuBtn" type="button" className="cmd-menu-btn hidden" title="Open CMD menu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="header-controls">
        <div className="mode-switch" title="Toggle CMD/OPS">
          <button id="modeCmdBtn" type="button" className="mode-switch-btn">
            CMD
          </button>
          <button id="modeOpsBtn" type="button" className="mode-switch-btn active">
            OPS
          </button>
        </div>
        <button id="profileBtn" type="button" className="profile-btn" title="Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </button>
        <div id="profileMenu" className="profile-dropdown hidden">
          <div id="axiomAccountSection" />
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