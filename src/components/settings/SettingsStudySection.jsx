import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { setStudyFeedbackPrefs } from '@/utils/study/feedback';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';
import {
  STUDY_BUDGET_TIERS,
  DEFAULT_STUDY_BUDGET_TIER,
  tierFromBudgetMin,
} from '@/utils/planner/constants';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';

const TIER_OPTIONS = [
  { id: 'light', label: 'Light', minutes: STUDY_BUDGET_TIERS.light },
  { id: 'standard', label: 'Standard', minutes: STUDY_BUDGET_TIERS.standard },
  { id: 'intensive', label: 'Intensive', minutes: STUDY_BUDGET_TIERS.intensive },
];

export default function SettingsStudySection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const activeTier = preferences?.studyBudgetTier
    ?? tierFromBudgetMin(preferences?.dailyTimeBudgetMin)
    ?? DEFAULT_STUDY_BUDGET_TIER;

  const save = (patch, { rebuildPlan = false } = {}) => {
    updatePrefs.mutate(patch, {
      onSuccess: async (_, variables) => {
        if ('haptics' in variables || 'audio' in variables) {
          setStudyFeedbackPrefs({
            haptics: (variables.haptics ?? preferences?.haptics) !== false,
            audio: (variables.audio ?? preferences?.audio) !== false,
          });
        }
        if (rebuildPlan) {
          try {
            await rebuildGlobalPlan({ force: true });
          } catch {
            /* plan rebuilds on next ensure */
          }
        }
      },
    });
  };

  const handleTierChange = (tierId) => {
    const minutes = STUDY_BUDGET_TIERS[tierId] ?? STUDY_BUDGET_TIERS.standard;
    save({
      studyBudgetTier: tierId,
      dailyTimeBudgetMin: minutes,
    }, { rebuildPlan: true });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Study defaults</h2>

      <div className="settings-field">
        <span className="settings-label">Daily study budget</span>
        <p className="settings-field-hint">
          How much time Veridian plans across all your journeys each day.
        </p>
        <div className="settings-budget-tiers" role="radiogroup" aria-label="Daily study budget">
          {TIER_OPTIONS.map((opt) => (
            <label key={opt.id} className="settings-budget-tier">
              <input
                type="radio"
                name="study-budget-tier"
                value={opt.id}
                checked={activeTier === opt.id}
                onChange={() => handleTierChange(opt.id)}
                disabled={updatePrefs.isPending}
              />
              <span className="settings-budget-tier-label">{opt.label}</span>
              <span className="settings-budget-tier-min">{opt.minutes} min/day</span>
            </label>
          ))}
        </div>
      </div>

      <p className="settings-hint">
        Budget tiers still apply in Keep sharp pacing (open or past-exam journeys stay lighter, not zero).
      </p>

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
