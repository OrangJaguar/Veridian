/**
 * One calm contextual line for the home welcome header.
 */
export function getHomeContextLine({ dueItems = [], journeys = [] }) {
  const examJourneys = journeys
    .filter((j) => j.examDate)
    .map((j) => ({
      title: j.title,
      days: Math.ceil((j.examDate - Date.now()) / 86400000),
    }))
    .filter((j) => j.days >= 0)
    .sort((a, b) => a.days - b.days);

  const soonExam = examJourneys.find((j) => j.days <= 7);
  if (soonExam) {
    const dayLabel = soonExam.days === 0
      ? 'today'
      : `${soonExam.days} day${soonExam.days === 1 ? '' : 's'} away`;
    return `${soonExam.title} is ${dayLabel}. One session at a time.`;
  }

  const count = dueItems.length;
  if (count === 0) {
    return 'Nothing scheduled for today — a good day to review or get ahead.';
  }
  if (count === 1) {
    return 'Light day — one session on the plan.';
  }
  return `${count} sessions today. Start with focus below and take them one at a time.`;
}
