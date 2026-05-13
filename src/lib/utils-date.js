/** Calendar / journal local date helpers (no app state). */

export function addDays(dateObj, days) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + days);
  return d;
}

export function toLocalDateKey(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDateKey(dateKey) {
  const parts = (dateKey || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getTodayKey() {
  return toLocalDateKey(new Date());
}

export function formatDate(dateStr, style = 'short') {
  if (!dateStr) return '';
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(d)) return dateStr;
  if (style === 'long') return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (style === 'short') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return d.toLocaleDateString();
}
export function getTodayISO() {
  return new Date().toISOString().split('T');
}
export function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}