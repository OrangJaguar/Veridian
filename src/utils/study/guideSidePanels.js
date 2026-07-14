function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function deriveTermLabel(sentence, index) {
  const words = String(sentence ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    const phrase = words.slice(0, Math.min(5, words.length)).join(' ');
    return phrase.length > 48 ? `${phrase.slice(0, 45)}…` : phrase;
  }
  return `Key idea ${index + 1}`;
}

/**
 * Fallback side-panel content for guides generated before keyTerms/takeaways existed.
 */
export function resolveGuideSidePanels(section) {
  const keyTerms = (section?.keyTerms ?? [])
    .map((item) => ({
      term: String(item?.term ?? '').trim(),
      definition: String(item?.definition ?? '').trim(),
    }))
    .filter((item) => item.term && item.definition)
    .slice(0, 5);

  const takeaways = (section?.takeaways ?? [])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 4);

  if (keyTerms.length && takeaways.length) {
    return { keyTerms, takeaways };
  }

  const sentences = splitSentences(section?.explanation);
  const derivedTerms = keyTerms.length
    ? keyTerms
    : sentences.slice(0, 3).map((sentence, index) => ({
      term: deriveTermLabel(sentence, index),
      definition: sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence,
    }));

  const derivedTakeaways = takeaways.length
    ? takeaways
    : sentences.slice(3, 6).map((sentence) => (
      sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence
    ));

  return {
    keyTerms: derivedTerms,
    takeaways: derivedTakeaways.filter(Boolean),
  };
}
