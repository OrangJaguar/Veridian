import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/queries/usePreferences';
import LearnerContextForm from '@/components/profile/LearnerContextForm';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import StudyActivityChart from '@/components/profile/StudyActivityChart';
import MasteryOverviewChart from '@/components/profile/MasteryOverviewChart';
import LoginPrompt from '@/components/stubs/LoginPrompt';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const { data: preferences } = usePreferences();

  if (!isAuthenticated) {
    return <LoginPrompt action="view your profile" />;
  }

  const memberSince = preferences?.createdAt
    ? format(new Date(preferences.createdAt), 'MMMM yyyy')
    : null;

  return (
    <div className="profile-page">
      <header className="profile-page-header">
        <div className="profile-page-header-copy">
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-page-lead">Your learner context and study overview.</p>
        </div>
        <Link to="/settings" className="btn btn-secondary btn-sm">Settings</Link>
      </header>

      <section className="profile-identity-card detail-section-box">
        <h2 className="profile-section-title">Identity</h2>
        {preferences?.username && (
          <p className="profile-identity-row">
            <span className="profile-identity-label">Username</span>
            <span>@{preferences.username}</span>
          </p>
        )}
        <p className="profile-identity-row">
          <span className="profile-identity-label">Email</span>
          <span>{user?.email}</span>
        </p>
        {memberSince && (
          <p className="profile-identity-row">
            <span className="profile-identity-label">Member since</span>
            <span>{memberSince}</span>
          </p>
        )}
      </section>

      <section className="profile-section detail-section-box">
        <h2 className="profile-section-title">Study overview</h2>
        <ProfileStatsCard />
        <StudyActivityChart />
        <MasteryOverviewChart />
      </section>

      <section className="profile-section detail-section-box">
        <h2 className="profile-section-title">Learner context</h2>
        <LearnerContextForm preferences={preferences} />
      </section>
    </div>
  );
}
