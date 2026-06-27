import { invokeToolsAssistant } from '@/api/ai/toolsAssistantClient';
import { notifyAiQuotaChanged } from '@/api/ai/quota';

function extractReviewText(res) {
  if (typeof res === 'string') return res;
  return res?.text || res?.summary || res?.reply || res?.data?.text || res?.data?.summary || '';
}

/**
 * Optional weekly review — grounded mirror, not motivational speech.
 */
export async function requestGoalsWeeklyReview({
  northStar,
  pillars,
  currentSeason,
  priorities,
  reflection,
  signal,
}) {
  const context = {
    type: 'goalsWeeklyReview',
    northStar: northStar?.text?.slice(0, 800) || '',
    pillars: (pillars || []).slice(0, 8).map((p) => ({
      title: p.title,
      description: p.description?.slice(0, 200),
    })),
    season: {
      title: currentSeason?.title,
      description: currentSeason?.description?.slice(0, 400),
      priorityAreas: currentSeason?.priorityAreas,
    },
    priorities: (priorities || []).map((p) => ({ text: p.text, status: p.status })),
    reflection: {
      movedForward: reflection?.movedForward?.slice(0, 400),
      slipped: reflection?.slipped?.slice(0, 400),
      blockers: reflection?.blockers?.slice(0, 400),
      alignedWithSeason: reflection?.alignedWithSeason,
      alignmentNote: reflection?.alignmentNote?.slice(0, 300),
    },
  };

  const res = await invokeToolsAssistant({
    text: [
      'Review this weekly goals check-in using ONLY the provided context.',
      'Return a short structured summary (3–5 bullet points max):',
      '1) What moved forward',
      '2) Patterns or recurring blockers',
      '3) Any mismatch between stated season/pillars and this week',
      '4) One suggestion to simplify next week',
      'Do not invent facts. Do not be preachy or motivational. Be calm and specific.',
    ].join(' '),
    context,
    signal,
  });

  notifyAiQuotaChanged();
  return extractReviewText(res);
}

/**
 * Optional setup clarify — reorganize user text only.
 */
export async function clarifyGoalsDraft({ field, draft, signal }) {
  const res = await invokeToolsAssistant({
    text: [
      `Help clarify my ${field}. Rewrite ONLY what I wrote — keep my voice and meaning.`,
      'Return the clarified text only, no preamble.',
      `Draft:\n${draft?.slice(0, 1200)}`,
    ].join('\n'),
    context: { type: 'goalsClarify', field },
    signal,
  });

  notifyAiQuotaChanged();
  return extractReviewText(res);
}
