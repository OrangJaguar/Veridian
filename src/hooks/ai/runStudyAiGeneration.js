/**
 * Run a guarded AI generation pipeline: invoke → normalize → validate → persist.
 */
export async function runStudyAiGeneration({
  generate,
  normalize,
  validate,
  persist,
}) {
  if (typeof generate !== 'function') {
    throw new Error('AI generation requires a generate function.');
  }
  if (typeof normalize !== 'function') {
    throw new Error('AI generation requires a normalize function.');
  }

  const raw = await generate();
  const normalized = normalize(raw);

  if (validate) {
    validate(normalized);
  }

  if (persist) {
    await persist(normalized);
  }

  return normalized;
}
