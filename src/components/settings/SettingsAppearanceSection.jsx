import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { applyThemeFromPreferences, persistThemeToStorage } from '@/lib/theme';
import VeridianSwitch from '@/components/shared/form/VeridianSwitch';

export default function SettingsAppearanceSection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const themeDark = preferences?.themeDark !== false;

  const handleToggle = (next) => {
    persistThemeToStorage(next);
    applyThemeFromPreferences({ themeDark: next });
    updatePrefs.mutate({ themeDark: next });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Appearance</h2>
      <div className="settings-toggle-row">
        <span>Dark mode</span>
        <VeridianSwitch
          checked={themeDark}
          onChange={handleToggle}
          disabled={updatePrefs.isPending}
          aria-label="Dark mode"
        />
      </div>
    </section>
  );
}
