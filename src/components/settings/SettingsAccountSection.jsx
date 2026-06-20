import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useChangePassword } from '@/hooks/mutations/useChangePassword';
import { isValidSignupPassword, passwordsMatch } from '@/utils/schemas/password';
import {
  AuthFieldRules,
  allRulesPass,
  buildConfirmPasswordRules,
  buildPasswordRules,
} from '@/components/auth/AuthFieldRules';

export default function SettingsAccountSection() {
  const { user } = useAuth();
  const { data: preferences } = usePreferences();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const passwordRules = buildPasswordRules(newPassword, passwordFocused);
  const confirmRules = buildConfirmPasswordRules(newPassword, confirmPassword, confirmFocused);
  const passwordReady = allRulesPass(passwordRules)
    && isValidSignupPassword(newPassword)
    && allRulesPass(confirmRules)
    && passwordsMatch(newPassword, confirmPassword)
    && currentPassword.length > 0;

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (!passwordReady || !user?.id) return;
    changePassword.mutate(
      { userId: user.id, currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordForm(false);
        },
      },
    );
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Account</h2>

      <div className="settings-field">
        <label className="settings-label" htmlFor="settings-email">Email</label>
        <input
          id="settings-email"
          type="email"
          className="settings-input settings-input-readonly"
          value={user?.email ?? ''}
          readOnly
        />
      </div>

      <div className="settings-field">
        <label className="settings-label" htmlFor="settings-username">Username</label>
        <div className="settings-username-row">
          <span className="settings-username-prefix">@</span>
          <input
            id="settings-username"
            type="text"
            className="settings-input settings-input-readonly"
            value={preferences?.username ?? ''}
            readOnly
            spellCheck={false}
          />
        </div>
        <p className="settings-hint">Usernames are permanent after signup.</p>
      </div>

      <div className="settings-field">
        <label className="settings-label">Password</label>
        {!showPasswordForm ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPasswordForm(true)}
          >
            Change password
          </button>
        ) : (
          <form onSubmit={handlePasswordSave} className="settings-password-form">
            <input
              type="password"
              className="settings-input"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <input
              type="password"
              className="settings-input"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete="new-password"
            />
            {(passwordFocused || newPassword.length > 0) && (
              <AuthFieldRules rules={passwordRules} columns={1} />
            )}
            <input
              type="password"
              className="settings-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              autoComplete="new-password"
            />
            {(confirmFocused || confirmPassword.length > 0) && (
              <AuthFieldRules rules={confirmRules} columns={1} />
            )}
            <div className="settings-inline-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!passwordReady || changePassword.isPending}
              >
                Update password
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPasswordForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
