import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { setStudyFeedbackPrefs } from '@/utils/study/feedback';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';
import VeridianSlider from '@/components/shared/form/VeridianSlider';

export default function SettingsStudySection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const save = (patch) => {
    updatePrefs.mutate(patch, {
      onSuccess: (_, variables) => {
        if ('haptics' in variables || 'audio' in variables) {
          setStudyFeedbackPrefs({
            haptics: (variables.haptics ?? preferences?.haptics) !== false,
            audio: (variables.audio ?? preferences?.audio) !== false,
          });
        }
      },
    });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Study defaults</h2>

      <div className="settings-field">
        <label className="settings-label" htmlFor="daily-budget">
          Daily study budget ({preferences?.dailyTimeBudgetMin ?? 35} min)
        </label>
        <VeridianSlider
          id="daily-budget"
          min={10}
          max={180}
          step={5}
          value={preferences?.dailyTimeBudgetMin ?? 35}
          onChange={(e) => save({ dailyTimeBudgetMin: Number(e.target.value) })}
          disabled={updatePrefs.isPending}
        />
      </div>

      <div className="settings-checkboxes-row">
        <VeridianCheckbox
          className="settings-veridian-check"
          checked={preferences?.strictMode === true}
          onChange={(e) => save({ strictMode: e.target.checked })}
          disabled={updatePrefs.isPending}
        >
          Strict mode for new quizzes (timed by default)
        </VeridianCheckbox>

        <VeridianCheckbox
          className="settings-veridian-check"
          checked={preferences?.haptics !== false}
          onChange={(e) => save({ haptics: e.target.checked })}
          disabled={updatePrefs.isPending}
        >
          Haptic feedback during study
        </VeridianCheckbox>

        <VeridianCheckbox
          className="settings-veridian-check"
          checked={preferences?.audio !== false}
          onChange={(e) => save({ audio: e.target.checked })}
          disabled={updatePrefs.isPending}
        >
          Sound effects during study
        </VeridianCheckbox>
      </div>
    </section>
  );
}
