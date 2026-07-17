import { describe, it, expect } from 'vitest';

function csvEscape(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sanitizeFilename(name) {
  return (name ?? 'flashcards').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'flashcards';
}

function buildTsv(cards) {
  return cards.map((c) => `${(c.front ?? '').replace(/\t/g, ' ')}\t${(c.back ?? '').replace(/\t/g, ' ')}`).join('\n');
}

function buildCsv(cards) {
  const header = 'front,back';
  const rows = cards.map((c) => `${csvEscape(c.front)},${csvEscape(c.back)}`);
  return [header, ...rows].join('\n');
}

describe('exportFlashcards logic', () => {
  it('generates correct TSV content', () => {
    const cards = [
      { front: 'What is 2+2?', back: '4' },
      { front: 'Capital of France?', back: 'Paris' },
    ];
    const tsv = buildTsv(cards);
    expect(tsv).toBe('What is 2+2?\t4\nCapital of France?\tParis');
  });

  it('strips tabs in TSV output', () => {
    const cards = [{ front: 'Has\ttab', back: 'back\there' }];
    const tsv = buildTsv(cards);
    expect(tsv).not.toContain('\t\t');
    expect(tsv).toBe('Has tab\tback here');
  });

  it('generates correct CSV with header', () => {
    const cards = [{ front: 'Hello', back: 'World' }];
    const csv = buildCsv(cards);
    expect(csv).toBe('front,back\nHello,World');
  });

  it('properly escapes commas and quotes in CSV', () => {
    const cards = [{ front: 'A, B, C', back: 'She said "hi"' }];
    const csv = buildCsv(cards);
    expect(csv).toContain('"A, B, C"');
    expect(csv).toContain('"She said ""hi"""');
  });

  it('sanitizes filenames by removing special characters', () => {
    expect(sanitizeFilename('My/Deck<Test>')).toBe('MyDeckTest');
    expect(sanitizeFilename('  spaces  ')).toBe('spaces');
    expect(sanitizeFilename(null)).toBe('flashcards');
    expect(sanitizeFilename('')).toBe('flashcards');
  });
});
