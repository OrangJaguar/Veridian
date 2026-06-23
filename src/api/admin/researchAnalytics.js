import { base44 } from '@/api/base44Client';

function invoke(action, payload = {}) {
  return base44.functions.invoke('getResearchAnalytics', { action, ...payload });
}

export async function fetchResearchDataHealth() {
  const res = await invoke('getDataHealth');
  return res?.data ?? res;
}

export async function fetchQualifyingPairs() {
  const res = await invoke('getQualifyingPairs');
  return res?.data ?? res;
}

export async function fetchDataQualityFlags() {
  const res = await invoke('getDataQualityFlags');
  return res?.data ?? res;
}

export async function exportResearchCsv(exportKey) {
  const res = await base44.functions.invoke('exportResearchData', { exportKey });
  return res?.data ?? res;
}
