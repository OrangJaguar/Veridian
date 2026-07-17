import { base44 } from '@/api/base44Client';
import { isValidUrl } from './validateUrl';

/**
 * Fetch text content from a URL via the server-side fetchUrlContent function.
 * @param {string} url
 * @returns {Promise<{ title: string, content: string, type: 'youtube' | 'webpage' }>}
 */
export async function fetchLinkContent(url) {
  const trimmed = url?.trim();
  if (!trimmed || !isValidUrl(trimmed)) {
    throw new Error('Please enter a valid URL starting with http:// or https://');
  }

  const res = await base44.functions.invoke('fetchUrlContent', { url: trimmed });

  if (res?.error?.message) {
    throw new Error(res.error.message);
  }

  const content = res?.content ?? res?.data?.content ?? '';
  const title = res?.title ?? res?.data?.title ?? '';
  const type = res?.type ?? res?.data?.type ?? 'webpage';

  if (!content || content.length < 20) {
    throw new Error('Could not extract enough content from this URL. Try pasting the text directly.');
  }

  return { title, content, type };
}
