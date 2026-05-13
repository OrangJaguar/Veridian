export function formatDate(date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'full':
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    default:
      return d.toLocaleDateString();
  }
}

export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

export function isToday(dateStr) {
  return dateStr.split('T')[0] === getTodayISO();
}

export function isOverdue(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function getDayOfWeek(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
}

export function getMonthDates(year, month) {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - i - 1);
    dates.push(d);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    dates.push(new Date(year, month + 1, i));
  }
  return dates;
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];