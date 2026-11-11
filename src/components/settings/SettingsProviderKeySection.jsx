import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function SettingsProviderKeySection() {
  const [status, setStatus] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke('providerKey', { action: 'status' })
      .then((res) => {
        if (!cancelled) setStatus(res?.data ?? res);
      })
      .catch(() => {
        if (!cancelled) setStatus({ configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    setSaving(true);
    try {
      const res = await base44.functions.invoke('providerKey', { action: 'save', apiKey });
      setStatus(res?.data ?? res);
      setApiKey('');
      setInfo('Key saved. AI requests now use your NVIDIA account.');
    } catch (err) {
      setError(err?.message || 'Could not save that key.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setError('');
    setInfo('');
    setSaving(true);
    try {
      const res = await base44.functions.invoke('providerKey', { action: 'delete' });
      setStatus(res?.data ?? res);
      setInfo('Key removed. AI features stay off until you add another.');
    } catch (err) {
      setError(err?.message || 'Could not remove the key.');
    } finally {
      setSaving(false);
    }
  }

  const configured = Boolean(status?.configured);

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">AI provider</h2>
      <p className="settings-section-lead">
        Veridian does not share one AI key across accounts. Paste your own NVIDIA Build key
        and study generations are billed to your NVIDIA account. Get a key at{' '}
        <a href="https://build.nvidia.com/settings/api-keys" target="_blank" rel="noreferrer">
          build.nvidia.com
        </a>
        . It starts with nvapi-.
      </p>

      {status == null ? <p className="settings-muted">Loading key status…</p> : null}

      {configured ? (
        <p className="settings-hint">
          A key is saved
          {status.last4 ? ` (ending in ${status.last4})` : ''}
          . It is encrypted on the server and is not shown again.
        </p>
      ) : (
        <p className="settings-hint">No key saved yet. Quizzes, guides, and journey generation stay off until you add one.</p>
      )}

      {error ? <div className="auth-banner auth-banner-error">{error}</div> : null}
      {info ? <div className="auth-banner auth-banner-info">{info}</div> : null}

      <form onSubmit={handleSave} className="settings-password-form">
        <input
          type="password"
          className="settings-input"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="nvapi-..."
          autoComplete="off"
          spellCheck={false}
        />
        <div className="settings-inline-actions">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={saving || apiKey.trim().length < 20}
          >
            {saving ? 'Saving…' : configured ? 'Replace key' : 'Save key'}
          </button>
          {configured ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRemove}
              disabled={saving}
            >
              Remove key
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
