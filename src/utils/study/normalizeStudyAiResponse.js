/**
 * Extract a named list from AI response payloads (handles nested { data: { items } }).
 */
export function extractAiField(data, field) {
  if (!data) return null;
  if (data[field] != null) return data[field];
  if (data.data && typeof data.data === 'object' && data.data[field] != null) {
    return data.data[field];
  }
  return null;
}

export function extractAiList(data, field) {
  const value = extractAiField(data, field);
  return Array.isArray(value) ? value : [];
}

/**
 * Action-specific normalizers entry point — callers pass dedicated normalize fns.
 */
export const studyAiFields = {
  questions: (data) => extractAiList(data, 'questions'),
  sections: (data) => extractAiList(data, 'sections'),
  cards: (data) => extractAiList(data, 'cards'),
};
