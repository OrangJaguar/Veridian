import { useState } from 'react';
import { useDeleteAccount } from '@/hooks/mutations/useDeleteAccount';

export default function DeleteAccountModal({ open, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const deleteAccount = useDeleteAccount();

  if (!open) return null;

  const canDelete = confirmText === 'DELETE';

  const handleDelete = () => {
    if (!canDelete) return;
    deleteAccount.mutate(undefined, {
      onSettled: () => {
        setConfirmText('');
        onClose();
      },
    });
  };

  return (
    <div className="delete-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="delete-account-modal"
        role="dialog"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-title" className="delete-modal-title">Delete account?</h2>
        <p className="delete-modal-lead">
          This permanently deletes your journeys, modules, sessions, and preferences.
          Type <strong>DELETE</strong> to confirm.
        </p>
        <input
          type="text"
          className="settings-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          autoFocus
        />
        <div className="delete-modal-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={!canDelete || deleteAccount.isPending}
          >
            {deleteAccount.isPending ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  );
}
