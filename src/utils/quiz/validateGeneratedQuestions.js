/**
 * Quality gates for AI-generated quiz questions (Plan 3).
 */

const META_STEM_PATTERNS = [
  /\bas an ai\b/i,
  /\bhere(?:'s| is) (?:a |the )?question\b/i,
  /\bi ('m|am) (?:going to |gonna )?(?:ask|create|generate)\b/i,
  /\bsure[,!]?\s+(?:here|i'll)\b/i,
];

const MIN_STEM_LEN = 12;

function normalizeStem(stem) {
  return String(stem ?? '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(stem) {
  return new Set(normalizeStem(stem).split(' ').filter((t) => t.length > 2));
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function isNearDuplicate(stemA, stemB) {
  const na = normalizeStem(stemA);
  const nb = normalizeStem(stemB);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 20 && (na.startsWith(nb.slice(0, 24)) || nb.startsWith(na.slice(0, 24)))) {
    return true;
  }
  return jaccard(tokenSet(na), tokenSet(nb)) >= 0.82;
}

function rejectReason(question, { existingStems = [], batchStems = [] } = {}) {
  if (!question?.type) return 'missing_type';
  const stem = String(question.stem ?? question.prompt ?? '').trim();
  if (!stem || stem.length < MIN_STEM_LEN) return 'thin_stem';
  if (META_STEM_PATTERNS.some((re) => re.test(stem))) return 'meta_stem';

  if (question.type === 'multipleChoice' || question.type === 'multiSelect') {
    const options = question.options ?? [];
    if (options.length < 2) return 'few_options';
    const texts = options.map((o) => normalizeStem(typeof o === 'string' ? o : o?.text ?? o?.label ?? ''));
    if (texts.some((t) => !t)) return 'empty_option';
    if (new Set(texts).size < texts.length) return 'duplicate_options';
  }

  if (question.type === 'matching') {
    const left = question.leftItems
      ?? question.left
      ?? question.pairs?.map((p) => p.left)
      ?? [];
    const right = question.rightItems
      ?? question.right
      ?? question.pairs?.map((p) => p.right)
      ?? [];
    if ((left?.length ?? 0) < 2 || (right?.length ?? 0) < 2) return 'incomplete_matching';
  }

  if (question.type === 'ordering') {
    const items = question.items ?? question.order ?? [];
    if ((items?.length ?? 0) < 2) return 'incomplete_ordering';
  }

  for (const other of existingStems) {
    if (isNearDuplicate(stem, other)) return 'near_duplicate_bank';
  }
  for (const other of batchStems) {
    if (isNearDuplicate(stem, other)) return 'near_duplicate_batch';
  }

  return null;
}

/**
 * @returns {{ ok: boolean, questions: object[], rejected: object[], reasons: string[] }}
 */
export function validateGeneratedQuestions(rawQuestions = [], {
  expectedCount = null,
  existingBank = [],
} = {}) {
  const existingStems = (existingBank ?? [])
    .map((q) => q?.stem ?? q?.prompt ?? '')
    .filter(Boolean);
  const accepted = [];
  const rejected = [];
  const reasons = [];
  const batchStems = [];

  for (const q of rawQuestions ?? []) {
    const reason = rejectReason(q, { existingStems, batchStems });
    if (reason) {
      rejected.push(q);
      reasons.push(reason);
      continue;
    }
    const stem = String(q.stem ?? q.prompt ?? '');
    batchStems.push(stem);
    accepted.push(q);
  }

  const need = expectedCount ?? 0;
  const ok = need > 0 ? accepted.length >= Math.ceil(need * 0.85) : accepted.length > 0;

  return { ok, questions: accepted, rejected, reasons };
}

export function collectRejectedStemPreviews(rejected = [], limit = 8) {
  return rejected
    .map((q) => String(q?.stem ?? q?.prompt ?? '').slice(0, 80))
    .filter(Boolean)
    .slice(0, limit);
}
