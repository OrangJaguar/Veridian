import { base44 } from '@/api/base44Client';

let quotaNotifyTimer = null;

export async function fetchAiQuotaStatus() {
  const res = await base44.functions.invoke('getAiQuotaStatus', {});
  if (res?.error?.message) throw new Error(res.error.message);
  return res?.data ?? res;
}

/** Debounced so concurrent AI calls do not stampede quota/auth endpoints. */
export function notifyAiQuotaChanged() {
  if (typeof window === 'undefined') return;
  if (quotaNotifyTimer != null) return;
  quotaNotifyTimer = window.setTimeout(() => {
    quotaNotifyTimer = null;
    window.dispatchEvent(new Event('veridian-ai-quota-changed'));
  }, 1500);
}
