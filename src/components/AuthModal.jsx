import { useState } from 'react';
import { base44 } from '../api/base44Client';

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      if (tab === 'login') {
        await base44.auth.login(email, password);
        const user = await base44.auth.me();
        onSuccess(user);
      } else {
        await base44.auth.register({ email, password, full_name: name });
        setSuccessMsg('Account created! Check your email to verify, then sign in.');
        setTab('login');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
            {tab === 'login' ? 'Sign in to Axiom' : 'Create an account'}
          </h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--surface)', borderRadius: '999px', padding: '3px', border: '1px solid var(--border)' }}>
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccessMsg(''); }}
                style={{ flex: 1, border: 'none', borderRadius: '999px', padding: '0.45rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'var(--primary-fg)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {successMsg && (
            <div style={{ background: 'var(--correct-bg)', color: 'var(--correct-text)', border: '1px solid var(--correct-border)', borderRadius: 'var(--radius)', padding: '0.65rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {successMsg}
            </div>
          )}
          {error && (
            <div style={{ background: 'var(--wrong-bg)', color: 'var(--wrong-text)', border: '1px solid var(--wrong-border)', borderRadius: 'var(--radius)', padding: '0.65rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tab === 'signup' && (
              <div className="agenda-modal-field" style={{ margin: 0 }}>
                <label>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoFocus />
              </div>
            )}
            <div className="agenda-modal-field" style={{ margin: 0 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus={tab === 'login'} />
            </div>
            <div className="agenda-modal-field" style={{ margin: 0 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'} required minLength={tab === 'signup' ? 8 : 1} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); setSuccessMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}>
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}