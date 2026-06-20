import { splitLatexAwareParagraphs, splitLatexAwareSentences } from '@/utils/latex/splitLatexAware';

/** Split explanation into two balanced halves for zigzag layout (preserves LaTeX). */
export function splitExplanationHalves(explanation = '') {
  const sentences = explanationDisplaySentences(explanation);
  if (sentences.length <= 1) {
    return { first: sentences, second: [] };
  }
  const mid = Math.ceil(sentences.length / 2);
  return {
    first: sentences.slice(0, mid),
    second: sentences.slice(mid),
  };
}

/** Display sentences — keeps $...$ intact for LatexRenderer. */
export function explanationDisplaySentences(textOrSection) {
  const text = typeof textOrSection === 'string'
    ? textOrSection
    : textOrSection?.explanation ?? '';
  const paragraphs = splitLatexAwareParagraphs(text);
  const all = [];
  for (const p of paragraphs) {
    const sents = splitLatexAwareSentences(p);
    if (sents.length) all.push(...sents);
    else if (p.trim()) all.push(p.trim());
  }
  return all;
}
