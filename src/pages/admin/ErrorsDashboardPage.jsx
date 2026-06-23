import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useErrorGroups,
  useErrorGroupDetail,
  useUpdateErrorGroupStatus,
} from '@/hooks/queries/useErrorDashboard';

function formatTs(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function StatusBadge({ status }) {
  return <span className={`error-status-badge error-status-${status ?? 'open'}`}>{status ?? 'open'}</span>;
}

function ErrorDetailPanel({ groupId, onClose }) {
  const { data, isLoading } = useErrorGroupDetail(groupId);
  const updateStatus = useUpdateErrorGroupStatus();
  const group = data?.group;
  const occurrences = data?.occurrences ?? [];

  if (isLoading) {
    return (
      <aside className="error-detail-panel">
        <p>Loading…</p>
      </aside>
    );
  }

  if (!group) {
    return (
      <aside className="error-detail-panel">
        <p>Group not found.</p>
        <button type="button" className="veridian-btn veridian-btn-ghost" onClick={onClose}>Close</button>
      </aside>
    );
  }

  return (
    <aside className="error-detail-panel">
      <div className="error-detail-header">
        <h2 className="error-detail-title">{group.message}</h2>
        <button type="button" className="error-detail-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="error-detail-meta">
        <StatusBadge status={group.status} />
        <span>{group.source} · {group.environment}</span>
        <span>{group.occurrenceCount ?? 0} occurrences · {group.distinctUserCount ?? 0} users</span>
        <span>Route: {group.route || '—'}</span>
        <span>First: {formatTs(group.firstSeenAt)}</span>
        <span>Last: {formatTs(group.lastSeenAt)}</span>
      </div>

      <div className="error-detail-actions">
        {['open', 'resolved', 'ignored'].map((status) => (
          <button
            key={status}
            type="button"
            className={`veridian-btn veridian-btn-ghost${group.status === status ? ' is-active' : ''}`}
            disabled={updateStatus.isPending || group.status === status}
            onClick={() => updateStatus.mutate({ groupId: group.groupId, status })}
          >
            {status}
          </button>
        ))}
      </div>

      {group.stackSample ? (
        <section className="error-detail-section">
          <h3>Stack sample</h3>
          <pre className="error-detail-stack">{group.stackSample}</pre>
        </section>
      ) : null}

      <section className="error-detail-section">
        <h3>Recent occurrences ({occurrences.length})</h3>
        <ul className="error-occurrence-list">
          {occurrences.map((occ) => (
            <li key={occ.occurrenceId ?? occ.id} className="error-occurrence-item">
              <div className="error-occurrence-head">
                <span>{formatTs(occ.createdAt)}</span>
                {occ.userEmail ? <span>{occ.userEmail}</span> : <span>anonymous</span>}
              </div>
              {occ.stack ? (
                <pre className="error-occurrence-stack">{occ.stack}</pre>
              ) : null}
              {occ.clientInfo && Object.keys(occ.clientInfo).length > 0 ? (
                <pre className="error-occurrence-context">{JSON.stringify(occ.clientInfo, null, 2)}</pre>
              ) : null}
              {occ.context && Object.keys(occ.context).length > 0 ? (
                <pre className="error-occurrence-context">{JSON.stringify(occ.context, null, 2)}</pre>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default function ErrorsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get('group');
  const [statusFilter, setStatusFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');

  const filters = useMemo(() => ({
    status: statusFilter || undefined,
    environment: envFilter || undefined,
  }), [statusFilter, envFilter]);

  const { data, isLoading, isError, error } = useErrorGroups(filters);
  const groups = data?.groups ?? [];

  function openGroup(groupId) {
    setSearchParams({ group: groupId });
  }

  function closeDetail() {
    setSearchParams({});
  }

  return (
    <div className="errors-dashboard">
      <header className="errors-dashboard-header">
        <div>
          <h1 className="errors-dashboard-title">Error monitoring</h1>
          <p className="errors-dashboard-lead">Grouped client and server errors.</p>
        </div>
        <div className="errors-dashboard-filters">
          <select
            className="veridian-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
          <select
            className="veridian-select"
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            aria-label="Filter by environment"
          >
            <option value="">All environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
      </header>

      {isLoading ? <p>Loading errors…</p> : null}
      {isError ? <p className="errors-dashboard-error">{error?.message ?? 'Failed to load errors'}</p> : null}

      {!isLoading && !groups.length ? (
        <div className="errors-dashboard-empty">
          <p>No errors recorded yet.</p>
        </div>
      ) : null}

      <div className={`errors-dashboard-body${selectedGroupId ? ' has-detail' : ''}`}>
        <div className="errors-dashboard-list">
          {groups.map((group) => (
            <button
              key={group.groupId ?? group.id}
              type="button"
              className={`error-group-row${selectedGroupId === group.groupId ? ' is-selected' : ''}`}
              onClick={() => openGroup(group.groupId)}
            >
              <div className="error-group-row-main">
                <span className="error-group-message">{group.message}</span>
                <span className="error-group-meta">
                  {group.source} · {group.route || '—'} · {group.occurrenceCount ?? 0}×
                </span>
              </div>
              <div className="error-group-row-side">
                <StatusBadge status={group.status} />
                <span className="error-group-time">{formatTs(group.lastSeenAt)}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedGroupId ? (
          <ErrorDetailPanel groupId={selectedGroupId} onClose={closeDetail} />
        ) : null}
      </div>
    </div>
  );
}
