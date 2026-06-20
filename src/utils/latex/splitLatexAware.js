/**
 * Split prose into sentences without breaking $...$ or $$...$$ math regions.
 */
export function splitLatexAwareSentences(text = '') {
  const source = String(text).trim();
  if (!source) return [];

  const sentences = [];
  let buf = '';
  let i = 0;
  let inInline = false;
  let inDisplay = false;

  const flush = () => {
    const chunk = buf.trim();
    if (chunk.length > 0) sentences.push(chunk);
    buf = '';
  };

  while (i < source.length) {
    if (!inInline && !inDisplay && source.startsWith('$$', i)) {
      buf += '$$';
      i += 2;
      inDisplay = true;
      continue;
    }
    if (inDisplay && source.startsWith('$$', i)) {
      buf += '$$';
      i += 2;
      inDisplay = false;
      continue;
    }
    if (!inInline && !inDisplay && source[i] === '$') {
      buf += '$';
      i += 1;
      inInline = true;
      continue;
    }
    if (inInline && source[i] === '$') {
      buf += '$';
      i += 1;
      inInline = false;
      continue;
    }

    const ch = source[i];
    if (!inInline && !inDisplay && /[.!?]/.test(ch)) {
      buf += ch;
      const rest = source.slice(i + 1);
      const nextNonSpace = rest.match(/^\s*(\S)/);
      if (!nextNonSpace || /^[A-Z0-9"']/.test(nextNonSpace[1]) || rest.trimStart().startsWith('\n')) {
        flush();
        i += 1;
        while (i < source.length && /\s/.test(source[i])) i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  flush();
  return sentences.length ? sentences : [source];
}

export function splitLatexAwareParagraphs(text = '') {
  return String(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
