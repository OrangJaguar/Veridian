import { useState } from 'react';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';

export default function SettingsDangerSection() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <section className="settings-section settings-danger-zone detail-section-box">
      <h2 className="settings-section-title">Danger zone</h2>
      <p className="settings-section-lead">
        Deleting your account removes your login, journeys, study data, preferences,
        and saved AI key. This cannot be undone. Email{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> if something
        still looks attached to your address afterward.
      </p>
      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={() => setDeleteOpen(true)}
      >
        Delete account
      </button>
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </section>
  );
}
