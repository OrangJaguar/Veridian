/**
 * Normalize concept list from module knowledgeMap for public preview.
 */
export function getModuleConcepts(module) {
  const km = module?.knowledgeMap;
  if (!km) return [];

  const raw = Array.isArray(km) ? km : km.concepts;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((c) => ({
      term: c.term ?? c.name ?? c.label ?? '',
      definition: c.definition ?? c.desc ?? '',
    }))
    .filter((c) => c.term);
}
