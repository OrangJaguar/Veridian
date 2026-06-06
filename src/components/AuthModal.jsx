import AuthForm from '@/components/auth/AuthForm';

export default function AuthModal({ onClose, onSuccess, initialTab = 'login' }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
            Sign in to Veridian
          </h2>
          <button type="button" className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <AuthForm
            defaultTab={initialTab}
            allowTabSwitch
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
}
