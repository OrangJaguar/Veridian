import * as pdfjs from 'pdfjs-dist';

// Base44 static hosting serves .mjs as application/octet-stream, which breaks
// bundled worker dynamic imports. CDN serves the correct JavaScript MIME type.
const PDFJS_VERSION = '6.0.227';
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_FILES = 3;
export const MIN_EXTRACTED_CHARS = 200;

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file) {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`${file.name} exceeds 20MB limit.`);
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const parts = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n\n').replace(/\s+/g, ' ').trim();
}

/**
 * @param {File[]} files
 * @returns {Promise<string>}
 */
export async function extractTextFromPdfFiles(files) {
  if (files.length > MAX_PDF_FILES) {
    throw new Error(`Maximum ${MAX_PDF_FILES} PDF files allowed.`);
  }

  const chunks = [];
  for (const file of files) {
    const text = await extractTextFromPdf(file);
    if (text.length < MIN_EXTRACTED_CHARS) {
      throw new Error(
        "This file doesn't appear to contain readable text. Try a different version or paste your notes directly.",
      );
    }
    chunks.push(`--- ${file.name} ---\n${text}`);
  }

  return chunks.join('\n\n');
}

/**
 * @param {File} file
 */
export async function extractTextFromTxt(file) {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`${file.name} exceeds 20MB limit.`);
  }
  return file.text();
}
