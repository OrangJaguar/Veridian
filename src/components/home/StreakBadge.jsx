import { useStudyStreak } from '@/hooks/useStudyStreak';

function FireIcon({ filled }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="streak-fire-icon"
    >
      <path d="M12 2c.5 3.5-1.5 6-1.5 6C14 10 15 6.5 15 6.5c1 3.5-.5 6.5-.5 6.5C17 11 19 8 19 8c0 6-4.5 10-7 10S5 14 5 8c0 0 2 3 4.5 3C9.5 8 11.5 5.5 12 2z" />
    </svg>
  );
}

export default function StreakBadge() {
  const { currentStreak, todayCompleted, isLoading } = useStudyStreak();

  if (isLoading || currentStreak === 0) return null;

  return (
    <div className={`streak-badge${todayCompleted ? ' streak-badge--active' : ''}`}>
      <FireIcon filled={todayCompleted} />
      <span className="streak-badge-count">{currentStreak}</span>
      <span className="streak-badge-label">day streak</span>
    </div>
  );
}
