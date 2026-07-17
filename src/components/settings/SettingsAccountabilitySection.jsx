import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';
import { WEEKDAY_KEYS } from '@/utils/schemas/accountability';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';

const DAY_LABELS = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

export default function SettingsAccountabilitySection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const unavailable = preferences?.unavailableWeekdays ?? [];
  const preferred = preferences?.preferredStudyDays ?? [];

  const save = (patch, { rebuildPlan = false } = {}) => {
    updatePrefs.mutate(patch, {
      onSuccess: async () => {
        if (rebuildPlan) {
          try {
            await rebuildGlobalPlan({ force: true });
          } catch {
            /* rebuild on next ensure */
          }
        }
      },
    });
  };

  const toggleDay = (key, field) => {
    const current = preferences?.[field] ?? [];
    const next = current.includes(key)
      ? current.filter((d) => d !== key)
      : [...current, key];
    save({ [field]: next }, { rebuildPlan: field === 'unavailableWeekdays' });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Availability & targets</h2>
      <p className="settings-section-lead">
        Shape the weekly plan around when you can study. Unavailable days stay empty unless you pin work there.
      </p>

      <div className="settings-field">
        <span className="settings-label">Timezone</span>
        <select
          className="settings-select"
          value={preferences?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(e) => save({ timezone: e.target.value })}
          disabled={updatePrefs.isPending}
        >
          {[
            ...new Set([
              preferences?.timezone,
              Intl.DateTimeFormat().resolvedOptions().timeZone,
              ...TIMEZONE_OPTIONS,
            ].filter(Boolean)),
          ].map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="settings-field">
        <span className="settings-label">Weekly target minutes</span>
        <input
          type="number"
          min={0}
          max={1500}
          className="settings-input"
          value={preferences?.weeklyTargetMinutes ?? ''}
          placeholder="Optional"
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : Number(e.target.value);
            save({ weeklyTargetMinutes: v }, { rebuildPlan: true });
          }}
          disabled={updatePrefs.isPending}
        />
      </div>

      <div className="settings-field">
        <span className="settings-label">Unavailable days</span>
        <div className="settings-day-toggles">
          {WEEKDAY_KEYS.map((key) => (
            <VeridianCheckbox
              key={`unavail-${key}`}
              className="settings-veridian-check"
              checked={unavailable.includes(key)}
              onChange={() => toggleDay(key, 'unavailableWeekdays')}
              disabled={updatePrefs.isPending}
            >
              {DAY_LABELS[key]}
            </VeridianCheckbox>
          ))}
        </div>
      </div>

      <div className="settings-field">
        <span className="settings-label">Preferred study days</span>
        <div className="settings-day-toggles">
          {WEEKDAY_KEYS.map((key) => (
            <VeridianCheckbox
              key={`pref-${key}`}
              className="settings-veridian-check"
              checked={preferred.includes(key)}
              onChange={() => toggleDay(key, 'preferredStudyDays')}
              disabled={updatePrefs.isPending}
            >
              {DAY_LABELS[key]}
            </VeridianCheckbox>
          ))}
        </div>
      </div>
    </section>
  );
}
