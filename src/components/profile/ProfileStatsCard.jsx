import { useProfileStats } from '@/hooks/queries/useProfileStats';
import { useStudyStreak } from '@/hooks/useStudyStreak';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0 min';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export default function ProfileStatsCard() {
  const { data: stats, isLoading } = useProfileStats();
  const { currentStreak, longestStreak } = useStudyStreak();

  if (isLoading) {
    return <p className="profile-stats-loading">Loading stats…</p>;
  }

  return (
    <div className="profile-stats-grid">
      <div className="profile-stat-card">
        <span className="profile-stat-value">{stats?.activeJourneys ?? 0}</span>
        <span className="profile-stat-label">Active journeys</span>
      </div>
      <div className="profile-stat-card">
        <span className="profile-stat-value">{formatDuration(stats?.totalStudyTimeMs)}</span>
        <span className="profile-stat-label">Total study time</span>
      </div>
      <div className="profile-stat-card">
        <span className="profile-stat-value">{stats?.reviewSessions ?? 0}</span>
        <span className="profile-stat-label">Review sessions</span>
      </div>
      <div className="profile-stat-card">
        <span className="profile-stat-value">{stats?.completedSessions ?? 0}</span>
        <span className="profile-stat-label">Sessions completed</span>
      </div>
      <div className="profile-stat-card">
        <span className="profile-stat-value">{currentStreak}</span>
        <span className="profile-stat-label">Current streak</span>
      </div>
      <div className="profile-stat-card">
        <span className="profile-stat-value">{longestStreak}</span>
        <span className="profile-stat-label">Longest streak</span>
      </div>
    </div>
  );
}
