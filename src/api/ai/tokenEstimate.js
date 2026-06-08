export const MAX_MATERIAL_CHARS = 80_000;

/** Rough token estimate: ~4 characters per token for English text. */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function isOverMaterialCap(text) {
  return (text?.length ?? 0) > MAX_MATERIAL_CHARS;
}

export function trimMaterial(text) {
  if (!text) return '';
  return text.trim().slice(0, MAX_MATERIAL_CHARS);
}
