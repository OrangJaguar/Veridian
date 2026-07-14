import { MODERATION_BLOCKLIST } from '@/utils/library/moderationBlocklist';

const LEET_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
};

const BLOCKED_COMPACT = MODERATION_BLOCKLIST.map((term) => compact(term)).filter(Boolean);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeForModeration(text) {
  let value = String(text ?? '').toLowerCase();
  value = value.normalize('NFKD').replace(/\p{M}/gu, '');
  value = value.replace(/[0-9@$]/g, (ch) => LEET_MAP[ch] ?? ch);
  return value;
}

export function compact(text) {
  return normalizeForModeration(text).replace(/[^a-z]/g, '');
}

function tokenize(text) {
  return normalizeForModeration(text).split(/[^a-z]+/).filter((w) => w.length > 1);
}

function findBlockedIssue(field, text) {
  const normalized = normalizeForModeration(text);
  const compacted = compact(text);
  const tokens = tokenize(text);

  for (const term of MODERATION_BLOCKLIST) {
    const termCompact = compact(term);
    if (!termCompact) continue;

    const hasSpaces = /\s/.test(term);
    if (hasSpaces) {
      if (normalized.includes(term) || compacted.includes(termCompact)) {
        return { field, reason: 'blocked_phrase' };
      }
      continue;
    }

    const wordRe = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    if (wordRe.test(normalized) || compacted.includes(termCompact)) {
      return { field, reason: 'blocked_term' };
    }
  }

  for (let size = 2; size <= 4 && size <= tokens.length; size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      const joined = tokens.slice(i, i + size).join('');
      for (const blocked of BLOCKED_COMPACT) {
        if (blocked.length >= 4 && joined.includes(blocked)) {
          return { field, reason: 'blocked_combo' };
        }
      }
    }
  }

  return null;
}

function issueMessage(issue) {
  const field = issue.field ?? 'content';
  if (issue.reason === 'blocked_combo') {
    return `${field} contains word combinations that aren't allowed in public journeys.`;
  }
  if (issue.reason === 'blocked_phrase') {
    return `${field} contains phrases that aren't allowed in public journeys.`;
  }
  return `${field} contains language that isn't allowed in public journeys.`;
}

/**
 * Scan labeled text fields for blocked terms, spaced combos, and leetspeak variants.
 */
export function moderateTexts(texts = []) {
  const issues = [];

  for (const entry of texts) {
    const text = String(entry?.text ?? '').trim();
    if (!text) continue;
    const issue = findBlockedIssue(entry.field ?? 'content', text);
    if (issue) {
      issues.push({ ...issue, message: issueMessage(issue) });
    }
  }

  return {
    allowed: issues.length === 0,
    issues,
    summary: issues[0]?.message ?? null,
  };
}

export function collectJourneyModerationTexts({ journey, modules = [], tags = [] }) {
  const texts = [
    { field: 'Journey title', text: journey?.title },
    { field: 'Subject', text: journey?.subject },
    { field: 'Prior knowledge', text: journey?.priorKnowledge },
    { field: 'Journey summary', text: journey?.knowledgeMap?.summary },
  ];

  for (const tag of tags ?? journey?.tags ?? []) {
    texts.push({ field: 'Tag', text: tag });
  }

  for (const mod of modules) {
    texts.push({ field: `Module name`, text: mod.name });
    texts.push({ field: `Module description`, text: mod.description });
    const concepts = mod.knowledgeMap?.concepts ?? mod.concepts ?? [];
    for (const concept of concepts) {
      texts.push({ field: 'Concept term', text: concept.term ?? concept.name });
      texts.push({ field: 'Concept definition', text: concept.definition });
    }
  }

  return texts;
}

export function scanJourneyForModeration({ journey, modules = [], tags }) {
  return moderateTexts(collectJourneyModerationTexts({ journey, modules, tags }));
}
