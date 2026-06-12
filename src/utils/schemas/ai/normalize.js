function clipString(value, max) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trim() : text;
}

/** Coerce Gemini output into schema-friendly shape before Zod validation. */
export function normalizeJourneyProposal(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const modules = Array.isArray(raw.modules) ? raw.modules : [];

  return {
    journeySummary: clipString(raw.journeySummary, 200),
    modules: modules.slice(0, 8).map((mod, moduleIndex) => {
      const concepts = Array.isArray(mod?.concepts) ? mod.concepts : [];
      const normalizedConcepts = concepts.slice(0, 10).map((concept, conceptIndex) => ({
        id: clipString(concept?.id, 32) || `c${conceptIndex + 1}`,
        term: clipString(concept?.term, 80),
        definition: clipString(concept?.definition, 80),
      })).filter((concept) => concept.term && concept.definition);

      return {
        name: clipString(mod?.name, 80),
        description: clipString(mod?.description, 120),
        concepts: normalizedConcepts.length > 0
          ? normalizedConcepts
          : [{
            id: 'c1',
            term: clipString(mod?.name, 80) || `Topic ${moduleIndex + 1}`,
            definition: clipString(mod?.description, 80) || 'Core concept',
          }],
      };
    }).filter((mod) => mod.name && mod.description && mod.concepts.length > 0),
  };
}
