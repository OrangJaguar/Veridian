import { TELEMETRY_KEY } from '../constants-storage';
import { S } from '../state';
import { cloudSaveTelemetry, isCloudEnabled } from '../cloudSync';

export function saveTelemetry() {
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(S.telemetry));
  if (isCloudEnabled()) cloudSaveTelemetry(S.telemetry).catch(() => {});
}