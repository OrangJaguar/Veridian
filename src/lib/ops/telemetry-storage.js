import { TELEMETRY_KEY } from '../constants-storage';
import { S } from '../state';

export function saveTelemetry(): void {
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(S.telemetry));
}
