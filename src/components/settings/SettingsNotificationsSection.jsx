import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import VeridianRadio from '@/components/shared/form/VeridianRadio';

const OPTIONS = [
  {
    value: 'off',
    label: 'Off',
    description: 'No study reminder emails.',
  },
  {
    value: 'daily',
    label: 'Weekly nudge',
    description: 'At most one email per week when you have active journeys.',
  },
  {
    value: 'urgent',
    label: 'Exam reminders only',
    description: 'Email when an exam is within 3 days (once per journey).',
  },
];

export default function SettingsNotificationsSection() {
  const { data: preferences } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Email notifications</h2>
      <p className="settings-section-lead">
        Emails are infrequent and opt-in. We never send marketing mail.
      </p>

      <div className="settings-notification-options">
        {OPTIONS.map((opt) => (
          <VeridianRadio
            key={opt.value}
            name="notificationPref"
            value={opt.value}
            className="settings-notification-option"
            checked={(preferences?.notificationPref ?? 'off') === opt.value}
            onChange={() => updatePrefs.mutate({ notificationPref: opt.value })}
            disabled={updatePrefs.isPending}
          >
            <strong>{opt.label}</strong>
            <span className="settings-notification-desc">{opt.description}</span>
          </VeridianRadio>
        ))}
      </div>
    </section>
  );
}
