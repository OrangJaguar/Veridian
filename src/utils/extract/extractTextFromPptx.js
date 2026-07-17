import JSZip from 'jszip';

export const MAX_PPTX_BYTES = 20 * 1024 * 1024;

/**
 * Extract plain text from a .pptx File.
 * PPTX files are ZIP archives with slide XML in ppt/slides/slideN.xml.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPptx(file) {
  if (file.size > MAX_PPTX_BYTES) {
    throw new Error(`${file.name} exceeds 20MB limit.`);
  }

  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/i)?.[1] ?? '0', 10);
      const numB = parseInt(b.match(/slide(\d+)/i)?.[1] ?? '0', 10);
      return numA - numB;
    });

  if (!slideEntries.length) {
    throw new Error(
      `${file.name} doesn't appear to be a valid PowerPoint file. Try a different file or paste your notes.`,
    );
  }

  const parser = new DOMParser();
  const parts = [];

  for (let i = 0; i < slideEntries.length; i++) {
    const xml = await zip.files[slideEntries[i]].async('text');
    const doc = parser.parseFromString(xml, 'application/xml');
    const textNodes = doc.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/drawingml/2006/main',
      't',
    );

    const slideTexts = [];
    for (let j = 0; j < textNodes.length; j++) {
      const t = textNodes[j].textContent?.trim();
      if (t) slideTexts.push(t);
    }

    if (slideTexts.length) {
      parts.push(`--- Slide ${i + 1} ---\n${slideTexts.join(' ')}`);
    }
  }

  const text = parts.join('\n\n').trim();
  if (!text) {
    throw new Error(
      `${file.name} doesn't contain readable text. Try a different file or paste your notes.`,
    );
  }

  return text;
}
