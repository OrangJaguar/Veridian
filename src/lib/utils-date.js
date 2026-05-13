/** Calendar / journal local date helpers (no app state). */

export function addDays(dateObj: Date, days: number): Date {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + days);
  return d;
}

export function toLocalDateKey(dateObj: Date | string | number): string {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const parts = (dateKey || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getTodayKey(): string {
  return toLocalDateKey(new Date());
}