import { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';

// Steps: 'form' | 'verify' | 'success'
export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function resetForm() {
    setError(''); setSuccessMsg(''); setCode('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetForm();
    setLoading(true);
    try {
      if (tab === 'login') {
        // Base44 SDK login — tries loginWithPassword, falls back to redirectToLogin
        if (typeof base44.auth.loginWithPassword === 'function') {
          await base44.auth.loginWithPassword(email, password);
          const user = await base44.auth.me();
          onSuccess(user);
        } else {
          // Fallback: redirect to hosted login page
          base44.auth.redirectToLogin(window.location.href);
        }
      } else {
        // Registration
        if (typeof base44.auth.register === 'function') {
          await base44.auth.register({ email, password, full_name: name });
          setSuccessMsg('Account created! Check your email for a verification code.');
          setStep('verify');
        } else if (typeof base44.auth.signup === 'function') {
          await base44.auth.signup({ email, password, full_name: name });
          setSuccessMsg('Account created! Check your email for a verification code.');
          setStep('verify');
        } else {
          setError('Registration not supported directly. Please use the hosted sign-in page.');
        }
      }
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Something went wrong. Try again.';
      // If email already exists / unverified, push to verify step
      if (/verif|confirm|code/i.test(msg)) {
        setSuccessMsg('Check your email for a verification code.');
        setStep('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    resetForm();
    setLoading(true);
    try {
      // Try different SDK method names for OTP/code verification
      let user = null;
      if (typeof base44.auth.verifyEmail === 'function') {
        await base44.auth.verifyEmail(email, code);
      } else if (typeof base44.auth.confirmEmail === 'function') {
        await base44.auth.confirmEmail(email, code);
      } else if (typeof base44.auth.verifyCode === 'function') {
        await base44.auth.verifyCode(email, code);
      } else if (typeof base44.auth.verify === 'function') {
        await base44.auth.verify({ email, code });
      } else {
        throw new Error('Email verification not available directly. Please use the hosted sign-in page.');
      }
      user = await base44.auth.me();
      onSuccess(user);
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Verification failed. Check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    resetForm();
    setLoading(true);
    try {
      if (typeof base44.auth.resendVerification === 'function') {
        await base44.auth.resendVerification(email);
      } else if (typeof base44.auth.resendCode === 'function') {
        await base44.auth.resendCode(email);
      } else {
        throw new Error('Resend not available directly.');
      }
      setSuccessMsg('Code resent! Check your email.');
    } catch (err) {
      setError(err?.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  }

  function handleUseHostedLogin() {
    base44.auth.redirectToLogin(window.location.href);
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
            {step === 'verify' ? 'Verify your email' : tab === 'login' ? 'Sign in to Axiom' : 'Create an account'}
          </h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>

          {step === 'verify' ? (
            /* ── VERIFICATION STEP ── */
            <>
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
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                A verification code was sent to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>. Enter it below.
              </p>
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="agenda-modal-field" style={{ margin: 0 }}>
                  <label>Verification Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.trim())}
                    placeholder="Enter code from email"
                    required
                    autoFocus
                    style={{ letterSpacing: '0.12em', fontSize: '1.1rem', textAlign: 'center' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleResendCode} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                  Resend code
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                <button onClick={() => { setStep('form'); setError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                  Back
                </button>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Code not working? Use the hosted sign-in page instead:
                </p>
                <button onClick={handleUseHostedLogin} className="btn" style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}>
                  ↗ Open Hosted Sign In
                </button>
              </div>
            </>
          ) : (
            /* ── FORM STEP ── */
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--surface)', borderRadius: '999px', padding: '3px', border: '1px solid var(--border)' }}>
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => { setTab(t); resetForm(); setStep('form'); }}
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

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Or use the hosted sign-in page:
                </p>
                <button onClick={handleUseHostedLogin} className="btn" style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }}>
                  ↗ Open Hosted Sign In
                </button>
              </div>

              <p style={{ marginTop: '0.85rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); resetForm(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}>
                  {tab === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}