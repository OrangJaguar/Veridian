import { base44 } from '@/api/base44Client';

function invoke(action, payload = {}) {
  return base44.functions.invoke('getAdminAnalytics', { action, ...payload });
}

export async function fetchAdminSummaryStats() {
  const res = await invoke('getSummaryStats');
  return res?.data ?? res;
}

export async function fetchAdminSignupTrend() {
  const res = await invoke('getSignupTrend');
  return res?.data ?? res;
}

export async function queryAdminConversation(question) {
  const res = await invoke('queryConversation', { question });
  return res?.data ?? res;
}
