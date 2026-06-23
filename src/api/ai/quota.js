import { base44 } from '@/api/base44Client';

export async function fetchAiQuotaStatus() {
  return base44.functions.invoke('getAiQuotaStatus', {});
}

export function notifyAiQuotaChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('veridian-ai-quota-changed'));
  }
}
