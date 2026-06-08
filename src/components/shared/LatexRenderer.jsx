import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderSegment(text, displayMode) {
  try {
    return katex.renderToString(text, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
    });
  } catch {
    return text;
  }
}

function renderMixed(text) {
  if (!text) return null;

  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let match = regex.exec(text);

  while (match) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const raw = match[0];
    const display = raw.startsWith('$$');
    const inner = display ? raw.slice(2, -2) : raw.slice(1, -1);
    parts.push({ type: 'math', value: renderSegment(inner.trim(), display) });
    last = match.index + raw.length;
    match = regex.exec(text);
  }

  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }

  return parts.map((p, i) => (
    p.type === 'text'
      ? <span key={i}>{p.value}</span>
      : <span key={i} dangerouslySetInnerHTML={{ __html: p.value }} />
  ));
}

export default function LatexRenderer({ text, className = '' }) {
  return <span className={className}>{renderMixed(text)}</span>;
}
