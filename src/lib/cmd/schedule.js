import { CMD_SCHEDULE_DEFAULT, CMD_SCHEDULE_KEY } from '../constants-storage';
import { S } from '../state';

export function ensureCmdSchedule(): void {
  try {
    const raw = localStorage.getItem(CMD_SCHEDULE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { schedule?: { weekday?: unknown[]; wednesday?: unknown[] } };
      if (p?.schedule && Array.isArray(p.schedule.weekday) && Array.isArray(p.schedule.wednesday)) {
        S.cmdScheduleAppData = p as { schedule: Record<string, unknown> };
        return;
      }
    }
  } catch {
    /* ignore */
  }
  S.cmdScheduleAppData = {
    schedule: JSON.parse(JSON.stringify(CMD_SCHEDULE_DEFAULT)) as Record<string, unknown>,
  };
  localStorage.setItem(CMD_SCHEDULE_KEY, JSON.stringify(S.cmdScheduleAppData));
}