import { generateSessionId } from '@/utils/schemas/ids';

const STEM_PREVIEW_LEN = 90;
const REGISTRY_CAP = 80;
const PROMPT_AVOID_CAP = 40;

function stemPreview(stem) {
  const s = String(stem ?? '').replace(/\s+/g, ' ').trim();
  return s.length <= STEM_PREVIEW_LEN ? s : `${s.slice(0, STEM_PREVIEW_LEN)}…`;
}

/**
 * Collect prior question ids + stem previews for dedup prompt (token-efficient).
 */
export function buildQuizAvoidList(activity, sessions = [], moduleId) {
  const registry = activity?.content?.quizRegistry?.seen ?? [];
  const fromSessions = sessions
    .filter((s) => s.moduleId === moduleId && s.activityType === 'practiceQuiz')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .slice(0, 8)
    .flatMap((s) => (s.sessionData?.questions ?? []).map((q) => ({
      id: q.id,
      stemPreview: stemPreview(q.stem),
      conceptId: q.conceptId,
    })));

  const merged = new Map();
  for (const entry of [...fromSessions, ...registry]) {
    if (entry?.id) merged.set(entry.id, entry);
  }

  const seen = [...merged.values()].slice(-REGISTRY_CAP);
  return {
    avoidQuestionIds: seen.map((s) => s.id).slice(-PROMPT_AVOID_CAP),
    avoidStemPreviews: seen.map((s) => s.stemPreview).filter(Boolean).slice(-PROMPT_AVOID_CAP),
    seen,
  };
}

/**
 * Merge new session questions into activity registry (compact, no full question bodies).
 */
export function mergeQuizRegistry(existingRegistry, questions) {
  const merged = new Map();
  for (const entry of existingRegistry?.seen ?? []) {
    if (entry?.id) merged.set(entry.id, entry);
  }
  for (const q of questions ?? []) {
    if (!q?.id) continue;
    merged.set(q.id, {
      id: q.id,
      stemPreview: stemPreview(q.stem),
      conceptId: q.conceptId ?? null,
    });
  }
  return { seen: [...merged.values()].slice(-REGISTRY_CAP) };
}

/**
 * Concepts least covered in prior questions (for newMaterial focus).
 */
export function underrepresentedConceptIds(concepts, seenEntries, limit = 5) {
  const counts = Object.fromEntries(concepts.map((c) => [c.id, 0]));
  for (const entry of seenEntries) {
    if (entry.conceptId && counts[entry.conceptId] != null) {
      counts[entry.conceptId] += 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export function ensureUniqueQuestionIds(questions) {
  const used = new Set();
  return questions.map((q, index) => {
    let id = String(q.id ?? '').trim();
    if (!id || used.has(id)) {
      id = `pq-${generateSessionId().slice(-8)}-${index}`;
    }
    used.add(id);
    return { ...q, id };
  });
}
