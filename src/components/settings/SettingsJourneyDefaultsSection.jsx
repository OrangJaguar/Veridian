import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';
import VeridianRadio from '@/components/shared/form/VeridianRadio';

export default function SettingsJourneyDefaultsSection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const save = (patch) => updatePrefs.mutate(patch);

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Journey defaults</h2>
      <p className="settings-section-lead">
        Defaults when creating new journeys. Per-journey sharing is still edited on each journey.
      </p>

      <div className="settings-field">
        <span className="settings-label">Default visibility</span>
        <div className="settings-radio-group">
          <VeridianRadio
            name="defaultPrivacy"
            value="private"
            checked={(preferences?.defaultPrivacy ?? 'private') === 'private'}
            onChange={() => save({ defaultPrivacy: 'private' })}
          >
            Private
          </VeridianRadio>
          <VeridianRadio
            name="defaultPrivacy"
            value="public"
            checked={preferences?.defaultPrivacy === 'public'}
            onChange={() => save({ defaultPrivacy: 'public' })}
          >
            Public (library)
          </VeridianRadio>
        </div>
      </div>

      <VeridianCheckbox
        className="settings-veridian-check"
        checked={preferences?.defaultShowSources === true}
        onChange={(e) => save({ defaultShowSources: e.target.checked })}
        disabled={updatePrefs.isPending}
      >
        Show sources on new journeys by default
      </VeridianCheckbox>
    </section>
  );
}
