import { base44 } from '@/api/base44Client';
import { collectClientInfo } from '@/utils/errors/collectClientInfo';

export async function submitFeedback({ type, message, replyEmail, route }) {
  const payload = {
    type,
    message,
    replyEmail: replyEmail?.trim() || undefined,
    route: route ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
    clientInfo: collectClientInfo(),
  };

  return base44.functions.invoke('submitFeedback', payload);
}
