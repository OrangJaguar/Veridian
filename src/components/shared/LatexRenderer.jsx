import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';
import { normalizeLatexText } from '@/utils/latex/normalizeLatexText';

function isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:');
}

/** Allow \href/\url only for safe protocols; blocks javascript:, data:, vbscript:, etc. */
function katexTrust(context) {
  if (context && (context.command === '\\href' || context.command === '\\url')) {
    return isSafeUrl(context.url);
  }
  return false;
}

function renderSegment(text, displayMode) {
  try {
    return katex.renderToString(text, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
      trust: katexTrust,
    });
  } catch {
    return text;
  }
}

function renderMixed(text) {
  if (!text) return null;

  const normalized = normalizeLatexText(text);
  const parts = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let match = regex.exec(normalized);

  while (match) {
    if (match.index > last) {
      parts.push({ type: 'text', value: normalized.slice(last, match.index) });
    }
    const raw = match[0];
    const display = raw.startsWith('$$');
    const inner = display ? raw.slice(2, -2) : raw.slice(1, -1);
    parts.push({ type: 'math', value: renderSegment(inner.trim(), display) });
    last = match.index + raw.length;
    match = regex.exec(normalized);
  }

  if (last < normalized.length) {
    parts.push({ type: 'text', value: normalized.slice(last) });
  }

  if (!parts.length) {
    parts.push({ type: 'text', value: normalized });
  }

  return parts.map((p, i) => (
    p.type === 'text'
      ? <span key={i}>{p.value}</span>
      : <span key={i} dangerouslySetInnerHTML={{ __html: p.value }} />
  ));
}

export default function LatexRenderer({ text, className = '' }) {
  return <span className={`latex-content${className ? ` ${className}` : ''}`}>{renderMixed(text)}</span>;
}