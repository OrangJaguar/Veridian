export default function SyncBanner({ onSignIn }) {
  return (
    <div id="axiomSyncBanner" style={{
      position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px',
      padding: '0.5rem 0.85rem 0.5rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.22)', zIndex: 999, whiteSpace: 'nowrap',
      animation: 'slideUpIn 0.3s ease'
    }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>☁ Guest mode — data stays local</span>
      <button onClick={onSignIn} style={{
        background: 'var(--primary)', border: 'none', color: 'var(--primary-fg)',
        borderRadius: '999px', padding: '0.3rem 0.7rem', fontSize: '0.72rem',
        fontWeight: 700, cursor: 'pointer'
      }}>
        Sync to account
      </button>
    </div>
  );
}