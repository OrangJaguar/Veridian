import { TELEMETRY_KEY } from '../constants-storage';
import { S } from '../state';

export function saveTelemetry() {
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(S.telemetry));
}