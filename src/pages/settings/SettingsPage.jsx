import { Link } from 'react-router-dom';
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
  const { isAuthenticated } = useAuth();

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
