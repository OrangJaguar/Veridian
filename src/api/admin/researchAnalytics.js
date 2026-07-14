import { invokeAdminFunction } from '@/api/admin/invokeAdminFunction';

function invoke(action, payload = {}) {
  return invokeAdminFunction('getResearchAnalytics', { action, ...payload });
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
  return invokeAdminFunction('exportResearchData', { exportKey });
}
