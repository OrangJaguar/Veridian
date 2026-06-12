import { explanationSentences } from '@/utils/study/guideSpeech';

/** Split explanation into two balanced halves for zigzag layout. */
export function splitExplanationHalves(explanation = '') {
  const sentences = explanationSentences(explanation);
  if (sentences.length <= 1) {
    return { first: sentences, second: [] };
  }
  const mid = Math.ceil(sentences.length / 2);
  return {
    first: sentences.slice(0, mid),
    second: sentences.slice(mid),
  };
}
