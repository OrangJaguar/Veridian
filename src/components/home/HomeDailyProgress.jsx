/** Daily session progress — completed count wired later. */
export default function HomeDailyProgress({ completed = 0, total = 0 }) {
  if (total === 0) return null;

  const pct = Math.round((completed / total) * 100);

  return (
    <div className="home-daily-progress" aria-label={`${completed} of ${total} sessions done today`}>
      <div className="home-daily-progress-label">
        <span>{completed} of {total} done today</span>
      </div>
      <div className="home-daily-progress-track">
        <div className="home-daily-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
