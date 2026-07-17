import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { normalizeNotificationPref } from '@/utils/schemas/preferences';
import VeridianRadio from '@/components/shared/form/VeridianRadio';
import VeridianCheckbox from '@/components/shared/form/VeridianCheckbox';

const OPTIONS = [
  {
    value: 'off',
    label: 'Off',
    description: 'No study reminder emails.',
  },
  {
    value: 'weekly',
    label: 'Weekly nudge',
    description: 'At most one email per week when you have active journeys or open commitments.',
  },
  {
    value: 'urgent',
    label: 'Exam reminders only',
    description: 'Email when an exam is within 3 days (once per journey).',
  },
];

const TRIGGER_OPTIONS = [
  { key: 'commitment', label: 'Open weekly commitments' },
  { key: 'dueWork', label: 'Due Today work waiting' },
  { key: 'exam', label: 'Upcoming exams' },
  { key: 'unfinished', label: 'Unfinished in-progress sessions' },
];

export default function SettingsNotificationsSection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const currentPref = normalizeNotificationPref(preferences?.notificationPref);
  const triggers = preferences?.reminderTriggers ?? {};
  const hour = preferences?.reminderLocalHour ?? 9;

  const saveTriggers = (key, checked) => {
    updatePrefs.mutate({
      reminderTriggers: {
        ...triggers,
        [key]: checked,
      },
    });
  };

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Email notifications</h2>
      <p className="settings-section-lead">
        Emails are infrequent and opt-in. We never send marketing mail. Existing accounts stay off until you choose a cadence.
      </p>

      <div className="settings-notification-options">
        {OPTIONS.map((opt) => (
          <VeridianRadio
            key={opt.value}
            name="notificationPref"
            value={opt.value}
            className="settings-notification-option"
            checked={currentPref === opt.value}
            onChange={() => updatePrefs.mutate({ notificationPref: opt.value })}
            disabled={updatePrefs.isPending}
          >
            <strong>{opt.label}</strong>
            <span className="settings-notification-desc">{opt.description}</span>
          </VeridianRadio>
        ))}
      </div>

      {currentPref !== 'off' && (
        <>
          <div className="settings-field" style={{ marginTop: '1rem' }}>
            <span className="settings-label">Preferred local hour</span>
            <input
              type="number"
              min={0}
              max={23}
              className="settings-input"
              value={hour}
              onChange={(e) => updatePrefs.mutate({
                reminderLocalHour: Math.min(23, Math.max(0, Number(e.target.value) || 0)),
              })}
              disabled={updatePrefs.isPending}
            />
            <p className="settings-field-hint">
              Reminders send near this hour in your timezone (defaults to 9).
            </p>
          </div>

          <div className="settings-field">
            <span className="settings-label">Remind me about</span>
            <div className="settings-checkboxes-row">
              {TRIGGER_OPTIONS.map((opt) => (
                <VeridianCheckbox
                  key={opt.key}
                  className="settings-veridian-check"
                  checked={triggers[opt.key] !== false}
                  onChange={(e) => saveTriggers(opt.key, e.target.checked)}
                  disabled={updatePrefs.isPending}
                >
                  {opt.label}
                </VeridianCheckbox>
              ))}
            </div>
            <p className="settings-field-hint">
              All triggers are on by default when email is enabled. Turn any off to silence that reason.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
