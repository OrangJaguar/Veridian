import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SettingsAccountSection from '@/components/settings/SettingsAccountSection';
import SettingsAppearanceSection from '@/components/settings/SettingsAppearanceSection';
import SettingsStudySection from '@/components/settings/SettingsStudySection';
import SettingsJourneyDefaultsSection from '@/components/settings/SettingsJourneyDefaultsSection';
import SettingsNotificationsSection from '@/components/settings/SettingsNotificationsSection';
import SettingsResearchSection from '@/components/settings/SettingsResearchSection';
import SettingsDangerSection from '@/components/settings/SettingsDangerSection';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginPrompt action="manage your settings" />;
  }

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <div className="settings-page-header-copy">
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-page-lead">
            Account, preferences, and app customization.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm settings-sign-out-btn"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      <SettingsAccountSection />
      <SettingsAppearanceSection />
      <SettingsStudySection />
      <SettingsJourneyDefaultsSection />
      <SettingsNotificationsSection />
      <SettingsResearchSection />
      <SettingsDangerSection />

      <nav className="settings-legal-links" aria-label="Legal">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </nav>
    </div>
  );
}
