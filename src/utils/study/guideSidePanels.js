function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
      term: `Point ${index + 1}`,
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
