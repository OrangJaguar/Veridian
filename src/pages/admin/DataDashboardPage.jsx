import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import AdminAnalyticsFunnel from '@/components/admin/AdminAnalyticsFunnel';
import AdminResearchSection from '@/components/admin/AdminResearchSection';
import { useAdminSummaryStats, useAdminSignupTrend, useAdminQuery } from '@/hooks/queries/useAdminAnalytics';
import { exportAdminCsv } from '@/api/admin/exportAdminData';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'exports', label: 'Exports' },
  { id: 'research', label: 'Research' },
];

const EXPORT_OPTIONS = [
  { key: 'users', label: 'All users' },
  { key: 'journeys', label: 'All journeys' },
  { key: 'quizSessions', label: 'Quiz sessions' },
  { key: 'flashcardSessions', label: 'Flashcard sessions' },
  { key: 'mastery', label: 'Mastery scores' },
  { key: 'eventLog', label: 'Event log (sessions)' },
];

export default function DataDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [exporting, setExporting] = useState(null);
  const threadRef = useRef(null);
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr } = useAdminSummaryStats();
  const { data: signupTrend = [], isError: trendError, error: trendErr } = useAdminSignupTrend();
  const queryMutation = useAdminQuery();

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (tab === 'research' && searchParams.get('tab') == null) {
    // default tab handled above
  }

  const handleAsk = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || queryMutation.isPending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    try {
      const result = await queryMutation.mutateAsync(q);
      setMessages((prev) => [...prev, { role: 'assistant', text: result.answerText }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message || 'Query failed.' }]);
    }
  };

  const handleExport = async (key) => {
    setExporting(key);
    try {
      await exportAdminCsv(key);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const setTab = (nextTab) => {
    setSearchParams(nextTab === 'overview' ? {} : { tab: nextTab });
  };

  const loadError = statsError ? statsErr?.message : trendError ? trendErr?.message : null;

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Data dashboard</h1>
        <p className="admin-dashboard-lead">
          Platform analytics, operational exports, and anonymized research data.
        </p>
        <nav className="admin-dashboard-tabs" aria-label="Data dashboard sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-dashboard-tab${tab === item.id ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'overview' && (
        <>
          <AdminAnalyticsFunnel />

          <section className="admin-dashboard-section admin-dashboard-chat" aria-label="Analytics chat">
            <div className="admin-chat-thread" ref={threadRef}>
              {messages.length === 0 && (
                <p className="admin-chat-empty">
                  Try: &quot;How many users signed up this week?&quot; or &quot;What is the most popular subject?&quot;
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`admin-chat-bubble admin-chat-bubble--${m.role}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <form className="admin-chat-form" onSubmit={handleAsk}>
              <input
                type="text"
                className="admin-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about users, journeys, sessions, mastery…"
                disabled={queryMutation.isPending}
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || queryMutation.isPending}>
                {queryMutation.isPending ? 'Querying…' : 'Ask'}
              </button>
            </form>
          </section>

          <section className="admin-dashboard-section" aria-label="Live stats">
            <h2 className="admin-section-title">Live summary</h2>
            {loadError ? (
              <p className="admin-dashboard-error" role="alert">
                Could not load analytics: {loadError}. Republish admin functions on Base44 if this persists.
              </p>
            ) : null}
            {statsLoading ? (
              <p className="journeys-status">Loading stats…</p>
            ) : (
              <div className="admin-stats-grid">
                <StatCard label="Registered users" value={stats?.totalUsers} />
                <StatCard label="Active (7 days)" value={stats?.activeUsers7d} />
                <StatCard label="Active (30 days)" value={stats?.activeUsers30d} />
                <StatCard label="Journeys created" value={stats?.totalJourneys} />
                <StatCard label="Modules created" value={stats?.totalModules} />
                <StatCard label="Quiz sessions" value={stats?.quizSessionsCompleted} />
                <StatCard label="Flashcard sessions" value={stats?.flashcardSessionsCompleted} />
                <StatCard label="Learning guides" value={stats?.learningGuidesGenerated} />
                <StatCard label="Feynman sessions" value={stats?.feynmanSessionsCompleted} />
                <StatCard label="Free recall sessions" value={stats?.freeRecallSessionsCompleted} />
                <StatCard label="Avg mastery" value={stats?.averageMastery != null ? `${stats.averageMastery}%` : null} />
                <StatCard label="Top subject" value={stats?.mostPopularSubject} />
              </div>
            )}

            {signupTrend.length > 0 && (
              <div className="admin-signup-chart">
                <h3 className="admin-chart-title">New signups (last 30 days)</h3>
                <ChartContainer
                  config={{ signups: { label: 'Signups', color: 'hsl(var(--primary))' } }}
                  className="admin-chart-container"
                >
                  <BarChart data={signupTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-signups)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'exports' && (
        <section className="admin-dashboard-section" aria-label="Data exports">
          <h2 className="admin-section-title">Operational exports</h2>
          <p className="admin-dashboard-lead">Download CSV snapshots for ops and support.</p>
          <div className="admin-export-grid">
            {EXPORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="btn btn-secondary admin-export-btn"
                onClick={() => handleExport(key)}
                disabled={exporting === key}
              >
                {exporting === key ? 'Exporting…' : label}
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === 'research' && <AdminResearchSection />}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value">{value ?? '—'}</span>
    </div>
  );
}

export function ResearchDataRedirect() {
  return <Navigate to="/admin/data?tab=research" replace />;
}
