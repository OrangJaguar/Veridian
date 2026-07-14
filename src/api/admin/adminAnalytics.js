import { invokeAdminFunction } from '@/api/admin/invokeAdminFunction';

function invoke(action, payload = {}) {
  return invokeAdminFunction('getAdminAnalytics', { action, ...payload });
}

export async function fetchAdminSummaryStats() {
  const res = await invoke('getSummaryStats');
  return res?.data ?? res;
}

export async function fetchAdminSignupTrend() {
  const res = await invoke('getSignupTrend');
  return res?.data ?? res;
}

export async function fetchAdminFunnelAnalytics() {
  const res = await invoke('getFunnelAnalytics');
  return res?.data ?? res;
}

export async function queryAdminConversation(question) {
  const res = await invoke('queryConversation', { question });
  return res?.data ?? res;
}
