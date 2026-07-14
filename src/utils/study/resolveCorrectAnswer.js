/**
 * Resolve AI MCQ correctAnswer values to the exact option string the UI compares against.
 * Handles letter keys (A–D), numeric indices, and prefixed options.
 */

function normalizeOptionText(value) {
  return String(value ?? '').trim();
}

function stripOptionPrefix(text) {
  return text.replace(/^[A-Da-d][).:\s]+/, '').trim();
}

/**
 * @param {unknown} rawCorrect
 * @param {unknown[]} [options]
 * @returns {string|null}
 */
export function resolveCorrectAnswer(rawCorrect, options = []) {
  const opts = (Array.isArray(options) ? options : [])
    .map(normalizeOptionText)
    .filter(Boolean);

  const ans = normalizeOptionText(rawCorrect);
  if (!opts.length) return ans || null;
  if (!ans) return opts[0] ?? null;

  const exact = opts.find((o) => o === ans);
  if (exact) return exact;

  const ci = opts.find((o) => o.toLowerCase() === ans.toLowerCase());
  if (ci) return ci;

  if (/^[A-D]$/i.test(ans)) {
    const index = ans.toUpperCase().charCodeAt(0) - 65;
    if (opts[index]) return opts[index];
  }

  if (/^\d+$/.test(ans)) {
    let index = Number(ans);
    if (index >= 1 && index <= opts.length) index -= 1;
    if (opts[index]) return opts[index];
  }

  const strippedAns = stripOptionPrefix(ans);
  if (strippedAns && strippedAns.length > 2) {
    const byStripped = opts.find((o) => stripOptionPrefix(o).toLowerCase() === strippedAns.toLowerCase());
    if (byStripped) return byStripped;
    const contains = opts.find((o) => o.toLowerCase().includes(strippedAns.toLowerCase()));
    if (contains) return contains;
  }

  const prefixed = opts.find((o) => stripOptionPrefix(o).toLowerCase() === ans.toLowerCase());
  if (prefixed) return prefixed;

  return opts.includes(ans) ? ans : null;
}

/**
 * Grade a multiple-choice response against stored correctAnswer + options.
 * @param {unknown} selected
 * @param {unknown} correctAnswer
 * @param {unknown[]} [options]
 */
export function gradeMcqResponse(selected, correctAnswer, options = []) {
  const resolved = resolveCorrectAnswer(correctAnswer, options);
  if (!resolved) return false;
  const pick = normalizeOptionText(selected);
  if (!pick) return false;
  return pick === resolved || pick.toLowerCase() === resolved.toLowerCase();
}
