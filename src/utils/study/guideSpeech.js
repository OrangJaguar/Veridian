/** Strip LaTeX delimiters for speech synthesis. */
export function stripLatex(text = '') {
  return String(text)
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]+\$/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split prose into speakable sentences. */
export function splitSentences(text = '') {
  const plain = stripLatex(text);
  if (!plain) return [];
  return plain.split(/(?<=[.!?])\s+/).filter((s) => s.length > 1);
}

/**
 * Build ordered speech segments from visible section content (not narrationText).
 * Each segment has a stable `key` for UI highlighting.
 */
export function buildSectionSpeechPlan(section) {
  if (!section) return [];

  const segments = [];

  segments.push({ key: 'title', text: stripLatex(section.title), block: 'title' });

  explanationSentences(section.explanation).forEach((sentence, i) => {
    segments.push({ key: `exp-${i}`, text: sentence, block: 'explanation', sentenceIndex: i });
  });

  (section.workedExamples ?? []).forEach((ex, exIdx) => {
    const base = `ex-${exIdx}`;
    segments.push({ key: `${base}-scenario`, text: stripLatex(ex.scenario), block: 'example', exampleIndex: exIdx });
    ex.steps.forEach((step, stepIdx) => {
      segments.push({ key: `${base}-step-${stepIdx}`, text: stripLatex(step), block: 'example', exampleIndex: exIdx });
    });
    segments.push({ key: `${base}-answer`, text: stripLatex(ex.answer), block: 'example', exampleIndex: exIdx });
    segments.push({ key: `${base}-reasoning`, text: stripLatex(ex.reasoning), block: 'example', exampleIndex: exIdx });
  });

  return segments.filter((s) => s.text.length > 0);
}

export function explanationSentences(textOrSection) {
  const text = typeof textOrSection === 'string'
    ? textOrSection
    : textOrSection?.explanation ?? '';
  const paragraphs = String(text).split(/\n\n+/).filter(Boolean);
  const all = [];
  for (const p of paragraphs) {
    const sents = splitSentences(p);
    if (sents.length) all.push(...sents);
    else {
      const plain = stripLatex(p);
      if (plain) all.push(plain);
    }
  }
  return all;
}
