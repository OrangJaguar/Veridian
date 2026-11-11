import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { completePasswordReset } from '@/api/auth/password';
import { isValidSignupPassword, passwordsMatch } from '@/utils/schemas/password';
import {
  AuthFieldRules,
  allRulesPass,
  buildConfirmPasswordRules,
  buildPasswordRules,
} from '@/components/auth/AuthFieldRules';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let settled = false;
    const ready = () => {
      if (!settled) {
        settled = true;
        setPhase('ready');
      }
    };
    const invalid = () => {
      if (!settled) {
        settled = true;
        setPhase('invalid');
      }
    };
    const hasLink = window.location.hash.includes('access_token')
      || window.location.search.includes('code=')
      || window.location.hash.includes('type=recovery');
    const { data } = base44.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        ready();
      }
    });
    base44.auth.getSession().then((session) => {
      if (session) ready();
      else if (!hasLink) invalid();
    });
    const timeout = window.setTimeout(() => invalid(), hasLink ? 8000 : 1500);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const passwordRules = buildPasswordRules(password, passwordFocused);
  const confirmRules = buildConfirmPasswordRules(password, confirmPassword, confirmFocused);
  const ready = phase === 'ready'
    && allRulesPass(passwordRules)
    && isValidSignupPassword(password)
    && allRulesPass(confirmRules)
    && passwordsMatch(password, confirmPassword);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready) return;
    setError('');
    setLoading(true);
    try {
      await completePasswordReset({ newPassword: password });
      navigate('/signin', { replace: true, state: { message: 'Password updated. Sign in with your new password.' } });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || err?.message;
      setError(typeof msg === 'string' ? msg : 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  if (phase !== 'ready') {
    return (
      <div className="reset-password-page">
        <h1 className="reset-password-title">
          {phase === 'checking' ? 'Checking reset link…' : 'Invalid reset link'}
        </h1>
        {phase === 'invalid' && (
          <>
            <p className="reset-password-lead">
              This password reset link is missing or invalid. Request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-primary">Request new link</Link>
          </>
        )}
      </div>
    );
  }

  return (
      <div className="reset-password-page">
        <h1 className="reset-password-title">Choose a new password</h1>
        <p className="reset-password-lead">Enter a new password for your account.</p>
        {error && <div className="auth-banner auth-banner-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form-fields">
          <div className="veridian-form-field auth-field-block" style={{ margin: 0 }}>
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
            {(passwordFocused || password.length > 0) && (
              <AuthFieldRules rules={passwordRules} columns={1} />
            )}
          </div>
          <div className="veridian-form-field auth-field-block" style={{ margin: 0 }}>
            <label htmlFor="reset-confirm">Confirm password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              required
              autoComplete="new-password"
            />
            {(confirmFocused || confirmPassword.length > 0) && (
              <AuthFieldRules rules={confirmRules} columns={1} />
            )}
          </div>
          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading || !ready}>
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
        <p className="reset-password-back">
          <Link to="/signin">← Back to sign in</Link>
        </p>
      </div>
  );
}
