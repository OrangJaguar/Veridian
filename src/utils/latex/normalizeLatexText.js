/**
 * Normalize common LaTeX patterns so KaTeX can render them reliably.
 */
export function normalizeLatexText(text = '') {
  let s = String(text);

  // \ce{...} outside math delimiters → inline math
  s = s.replace(/(?<!\$)\\ce\{([^}]+)\}(?!\$)/g, '$\\ce{$1}$');

  // \( ... \) → $ ... $
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => `$${inner.trim()}$`);

  // \[ ... \] → $$ ... $$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$${inner.trim()}$$`);

  // Bare chemical-style subscripts (e.g. H_2O, CO_2) when not already in math
  s = s.replace(
    /(?<![$\\A-Za-z])(\b[A-Z][A-Za-z0-9]*(?:_\{[^}]+\}|_\d+|\^\{[^}]+\}|\^\d+)+)(?![$A-Za-z])/g,
    (match) => `$${match}$`,
  );

  return s;
}
