import { useState, useRef } from 'react';
import { base44 } from '../api/base44Client';

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef([]);

  function resetMessages() { setError(''); setInfo(''); }

  // ── OTP input handlers ──
  function handleDigitChange(idx, val) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleDigitKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  }

  function handleDigitPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  const otpCode = digits.join('');

  // ── Form submit (login or signup) ──
  async function handleSubmit(e) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (tab === 'login') {
        await base44.auth.loginViaEmailPassword(email, password);
        const user = await base44.auth.me();
        onSuccess(user);
      } else {
        await base44.auth.register({ email, password, full_name: name });
        setInfo('Code sent! Check your email.');
        setStep('verify');
      }
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Something went wrong.';
      if (/verif|otp|code/i.test(msg)) {
        setInfo('Check your email for a verification code.');
        setStep('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── OTP verify ──
  async function handleVerify(e) {
    e.preventDefault();
    if (otpCode.length < 6) { setError('Please enter all 6 digits.'); return; }
    resetMessages();
    setLoading(true);
    try {
      await base44.auth.verifyOtp(email, otpCode);
      const user = await base44.auth.me();
      onSuccess(user);
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ──
  async function handleResend() {
    resetMessages();
    setLoading(true);
    try {
      await base44.auth.resendOtp(email);
      setInfo('New code sent!');
    } catch (err) {
      setError(err?.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
            {step === 'verify' ? 'Verify your email' : tab === 'login' ? 'Sign in to Axiom' : 'Create an account'}
          </h2>
          <button className="close-modal-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {/* Messages */}
          {info && (
            <div style={{ background: 'var(--correct-bg)', color: 'var(--correct-text)', border: '1px solid var(--correct-border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {info}
            </div>
          )}
          {error && (
            <div style={{ background: 'var(--wrong-bg)', color: 'var(--wrong-text)', border: '1px solid var(--wrong-border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {step === 'verify' ? (
            /* ── VERIFY STEP ── */
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                A 6-digit code was sent to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>.
              </p>

              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 6-box OTP input */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={i === 0 ? handleDigitPaste : undefined}
                      autoFocus={i === 0}
                      style={{
                        width: 44, height: 52, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                        fontFamily: 'var(--font-mono)', background: 'var(--surface)',
                        border: `1px solid ${d ? 'var(--text-main)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)', color: 'var(--text-main)', outline: 'none',
                        caretColor: 'transparent'
                      }}
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading || otpCode.length < 6}
                  style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                <button onClick={handleResend} disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}>
                  Resend code
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>·</span>
                <button onClick={() => { setStep('form'); resetMessages(); setDigits(['','','','','','']); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}>
                  Back
                </button>
              </div>
            </>
          ) : (
            /* ── FORM STEP ── */
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--surface)', borderRadius: '999px', padding: '3px', border: '1px solid var(--border)' }}>
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => { setTab(t); resetMessages(); }}
                    style={{ flex: 1, border: 'none', borderRadius: '999px', padding: '0.45rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'var(--primary-fg)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                    {t === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

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
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); resetMessages(); }}
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