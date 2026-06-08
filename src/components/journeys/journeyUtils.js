import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export function examLabel(examDate) {
  if (!examDate) return 'No deadline';
  const days = differenceInDays(new Date(examDate), new Date());
  if (days < 0) return 'Past deadline';
  if (days === 0) return 'Exam today';
  if (days === 1) return 'Exam in 1 day';
  return `Exam in ${days} days`;
}

export function formatLastStudied(lastStudiedAt) {
  if (!lastStudiedAt) return 'Not studied yet';
  return `Last studied ${formatDistanceToNow(new Date(lastStudiedAt), { addSuffix: true })}`;
}

export function isLastStudiedWarning(lastStudiedAt, examDate) {
  if (!lastStudiedAt || !examDate) return false;
  const daysSinceStudy = differenceInDays(new Date(), new Date(lastStudiedAt));
  const daysUntilExam = differenceInDays(new Date(examDate), new Date());
  return daysSinceStudy > 5 && daysUntilExam <= 14 && daysUntilExam >= 0;
}

export function dominantStage(modules) {
  if (!modules?.length) return 'B';
  const counts = { A: 0, B: 0, C: 0 };
  for (const mod of modules) {
    const s = mod.stage || 'A';
    if (counts[s] != null) counts[s] += 1;
  }
  if (counts.B >= counts.A && counts.B >= counts.C) return 'B';
  if (counts.C >= counts.A) return 'C';
  return 'A';
}

export function averageMastery(modules) {
  if (!modules?.length) return 0;
  const sum = modules.reduce((acc, m) => acc + (m.masteryScore ?? 0), 0);
  return Math.round(sum / modules.length);
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTodayDate(date = new Date()) {
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function urgencyLabel(urgencyDays) {
  if (urgencyDays >= 999) return '';
  if (urgencyDays === 0) return 'Exam today';
  if (urgencyDays === 1) return 'Exam in 1 day';
  return `Exam in ${urgencyDays} days`;
}
