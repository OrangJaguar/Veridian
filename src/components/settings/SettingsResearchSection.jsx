import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';

export default function SettingsResearchSection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const handleToggle = (checked) => {
    updatePrefs.mutate({
      researchConsent: checked,
      researchConsentAt: checked ? Date.now() : undefined,
    });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Research & privacy</h2>
      <p className="settings-section-lead">
        If you opt in, anonymized study patterns (session duration, accuracy, hints used)
        may be included in academic research. Your content and identity are never shared.
      </p>
      <VeridianCheckbox
        className="settings-veridian-check"
        checked={preferences?.researchConsent === true}
        onChange={(e) => handleToggle(e.target.checked)}
        disabled={updatePrefs.isPending}
      >
        Contribute anonymized study data to research
      </VeridianCheckbox>
    </section>
  );
}
